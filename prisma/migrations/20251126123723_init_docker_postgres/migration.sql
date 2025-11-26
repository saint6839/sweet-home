-- CreateTable
CREATE TABLE "housing_complexes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "imageUrl" TEXT,
    "detailUrl" TEXT,
    "description" TEXT,
    "dataHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_complexes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "housing_complexes_district_idx" ON "housing_complexes"("district");
