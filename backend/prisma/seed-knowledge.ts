import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.knowledgeArticle.count();
  if (existing > 0) {
    console.log('Knowledge articles already seeded, skipping.');
    return;
  }

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        title: 'Modern Drip Irrigation Techniques',
        body: 'Learn the best practices for setting up and maintaining a modern drip irrigation system on your farm. Covers equipment selection, layout planning, and water conservation techniques to maximise your yield while minimising water usage.',
        category: 'Farming Practices',
        thumbnailUrl: '/original-ce576c08fad8c5133a2351e4262643c1-2.webp',
        videoUrl: '#',
        isVideo: true,
      },
      {
        title: 'Organic Fertilizer Preparation',
        body: 'Step-by-step guide to preparing compost, vermicompost, and liquid organic fertilisers at home using farm waste materials. Reduce input costs and improve soil health.',
        category: 'Fertilizers',
        thumbnailUrl: '/original-ce576c08fad8c5133a2351e4262643c1-3.webp',
        videoUrl: '#',
        isVideo: true,
      },
      {
        title: 'Pest Control for Tomatoes',
        body: 'Identify common tomato pests and diseases in West Africa and learn integrated pest management techniques to protect your crop without harming the environment.',
        category: 'Crop Protection',
        thumbnailUrl: '/original-ce576c08fad8c5133a2351e4262643c1-2.webp',
        videoUrl: '#',
        isVideo: true,
      },
      {
        title: 'Soil Testing 101',
        body: 'A practical guide to understanding your soil composition, pH levels, and nutrient content. Learn to interpret soil test results and apply appropriate amendments.',
        category: 'Farming Practices',
        thumbnailUrl: null,
        isVideo: false,
      },
      {
        title: 'Water Management on the Farm',
        body: 'Strategies for conserving water, scheduling irrigation, and managing drainage on small and medium farms in Ghana.',
        category: 'Farming Practices',
        thumbnailUrl: null,
        isVideo: false,
      },
    ],
  });

  console.log('Knowledge articles seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
