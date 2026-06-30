import "dotenv/config";
import { prisma } from "../src/lib/db.js";

async function main() {
  const userId = process.env.DEFAULT_USER_ID ?? "user_default";

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: "Matheus",
      preferredName: "Matheus",
      timezone: "America/Sao_Paulo"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
