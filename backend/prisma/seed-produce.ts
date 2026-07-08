import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import {
  GHANA_PRODUCE_CATALOG,
  pickCatalogForFarmer,
} from '../src/produce/produce.constants';
import {
  getCloudinaryConfig,
  uploadImageUrlToCloudinary,
} from './cloudinary-upload';

const prisma = new PrismaClient();
const CLOUD_FOLDER = 'freshlink/produce';
const DEMO_FARMER_PASSWORD = 'Freshlink1!';

const DEMO_FARMERS = [
  { name: 'Kwame Asante', phone: '+233501234501', farmName: 'Asante Farms', location: 'Kumasi' },
  { name: 'Ama Mensah', phone: '+233501234502', farmName: 'Mensah Gardens', location: 'Accra' },
  { name: 'Kofi Boateng', phone: '+233501234503', farmName: 'Boateng Orchard', location: 'Tamale' },
  { name: 'Yaa Osei', phone: '+233501234504', farmName: 'Osei Greens', location: 'Cape Coast' },
];

async function ensureDemoFarmers() {
  const farmerCount = await prisma.farmerProfile.count();
  if (farmerCount > 0) {
    console.log(`Found ${farmerCount} farmer profile(s) — skipping demo farmer creation.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_FARMER_PASSWORD, 12);

  for (const demo of DEMO_FARMERS) {
    await prisma.user.create({
      data: {
        role: UserRole.farmer,
        name: demo.name,
        phone: demo.phone,
        passwordHash,
        isVerified: true,
        language: 'en',
        farmerProfile: {
          create: {
            farmName: demo.farmName,
            location: demo.location,
          },
        },
      },
    });
    console.log(`Created demo farmer: ${demo.name} (${demo.phone})`);
  }
}

function priceVariance(base: number, farmerIndex: number, itemIndex: number): number {
  const bump = ((farmerIndex + itemIndex) % 5) - 2;
  return Math.max(3, Math.round((base + bump) * 100) / 100);
}

async function buildCloudinaryImageMap() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const map = new Map<string, string>();

  for (const item of GHANA_PRODUCE_CATALOG) {
    const secureUrl = await uploadImageUrlToCloudinary({
      sourceUrl: item.sourceImageUrl,
      cloudName,
      apiKey,
      apiSecret,
      folder: CLOUD_FOLDER,
      publicId: item.imageKey,
    });
    map.set(item.title, secureUrl);
  }

  return map;
}

async function main() {
  await ensureDemoFarmers();

  const farmers = await prisma.farmerProfile.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { id: 'asc' },
  });

  if (farmers.length === 0) {
    console.log('No farmers found — nothing to seed.');
    return;
  }

  console.log('Uploading produce images to Cloudinary…');
  const imageByTitle = await buildCloudinaryImageMap();
  console.log(`✓ ${imageByTitle.size} Cloudinary images ready\n`);

  const existingIds = await prisma.produceListing.findMany({
    where: { status: { not: 'deleted' } },
    select: { id: true },
  });
  const ids = existingIds.map((r) => r.id);

  if (ids.length > 0) {
    await prisma.favorite.deleteMany({ where: { produceId: { in: ids } } });
    await prisma.cartItem.deleteMany({ where: { produceId: { in: ids } } });
    await prisma.priceHistory.deleteMany({ where: { produceId: { in: ids } } });
    const archived = await prisma.produceListing.updateMany({
      where: { id: { in: ids } },
      data: { status: 'deleted' },
    });
    console.log(`Archived ${archived.count} old produce listings.`);
  }

  let created = 0;

  for (const [farmerIndex, farmer] of farmers.entries()) {
    const catalog = pickCatalogForFarmer(farmerIndex, 5);

    for (const [itemIndex, item] of catalog.entries()) {
      const price = priceVariance(item.basePrice, farmerIndex, itemIndex);
      const stock = 40 + ((farmerIndex + itemIndex) % 6) * 15;
      const imageUrl = imageByTitle.get(item.title);

      const produce = await prisma.produceListing.create({
        data: {
          farmerId: farmer.id,
          title: item.title,
          description: item.description,
          category: item.category,
          unit: item.unit,
          price,
          stock,
          images: imageUrl ? [imageUrl] : [],
          status: 'active',
        },
      });

      await prisma.priceHistory.create({
        data: { produceId: produce.id, price },
      });

      created++;
    }

    console.log(`✓ ${farmer.user.name}: ${catalog.length} items with images`);
  }

  console.log('\nDone.');
  console.log(`Farmers seeded: ${farmers.length}`);
  console.log(`Listings created: ${created}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
