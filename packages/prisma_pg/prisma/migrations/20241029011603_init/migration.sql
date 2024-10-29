-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "creator_address" VARCHAR(255);

-- CreateTable
CREATE TABLE "TokenCreator" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "token_address" VARCHAR(255),
    "display_name" VARCHAR(255),
    "twitter_type" VARCHAR(255),
    "followers_count" INTEGER DEFAULT 0,
    "following_count" INTEGER DEFAULT 0,
    "view_count" INTEGER DEFAULT 0,
    "is_verified" BOOLEAN DEFAULT false,
    "twitter_content" TEXT,
    "twitter_created_at" TIMESTAMP(3),
    "subscription_count" INTEGER DEFAULT 0,
    "creator_address" VARCHAR(255),
    "total_token_count" INTEGER DEFAULT 0,
    "valuable_token_count" INTEGER DEFAULT 0,
    "valuable_tokens_detail" JSON,
    "total_deployments" INTEGER DEFAULT 0,
    "successful_deployments" INTEGER DEFAULT 0,
    "failed_deployments" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenCreator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenCreator_username_key" ON "TokenCreator"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCreator_token_address_key" ON "TokenCreator"("token_address");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCreator_creator_address_key" ON "TokenCreator"("creator_address");

-- CreateIndex
CREATE INDEX "TokenCreator_creator_address_idx" ON "TokenCreator"("creator_address");

-- CreateIndex
CREATE INDEX "TokenCreator_token_address_creator_address_idx" ON "TokenCreator"("token_address", "creator_address");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCreator_token_address_creator_address_key" ON "TokenCreator"("token_address", "creator_address");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_creator_address_fkey" FOREIGN KEY ("creator_address") REFERENCES "TokenCreator"("creator_address") ON DELETE SET NULL ON UPDATE CASCADE;
