import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { GHANA_PRODUCE_CATALOG } from '../src/produce/produce.constants';
import {
  getCloudinaryConfig,
  uploadImageUrlToCloudinary,
} from './cloudinary-upload';

const prisma = new PrismaClient();
const CLOUD_FOLDER = 'freshlink/produce';

async function buildCloudinaryImageMap(): Promise<Map<string, string>> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const byTitle = new Map<string, string>();

  for (const item of GHANA_PRODUCE_CATALOG) {
    console.log(`Uploading ${item.title} → Cloudinary…`);
    try {
      const secureUrl = await uploadImageUrlToCloudinary({
        sourceUrl: item.sourceImageUrl,
        cloudName,
        apiKey,
        apiSecret,
        folder: CLOUD_FOLDER,
        publicId: item.imageKey,
      });
      byTitle.set(item.title, secureUrl);
      console.log(`  ✓ ${secureUrl}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed for ${item.title}: ${message}`);
    }
  }

  return byTitle;
}

async function main() {
  const imageByTitle = await buildCloudinaryImageMap();

  const listings = await prisma.produceListing.findMany({
    where: { status: 'active' },
    select: { id: true, title: true, images: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const listing of listings) {
    const url = imageByTitle.get(listing.title);
    if (!url) {
      skipped++;
      continue;
    }

    if (listing.images[0] === url) {
      skipped++;
      continue;
    }

    await prisma.produceListing.update({
      where: { id: listing.id },
      data: { images: [url] },
    });
    updated++;
  }

  console.log('\nDone.');
  console.log(`Cloudinary assets: ${imageByTitle.size}`);
  console.log(`Listings updated: ${updated}`);
  console.log(`Listings skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
