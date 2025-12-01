-- CreateTable
CREATE TABLE "notification_logs_table" (
    "id" BIGSERIAL NOT NULL,
    "tableName" VARCHAR(255) NOT NULL,
    "action" VARCHAR(10) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_table" (
    "id" SERIAL NOT NULL,
    "col_b_01" BOOLEAN NOT NULL DEFAULT false,
    "col_b_02" BOOLEAN NOT NULL DEFAULT false,
    "col_b_03" BOOLEAN NOT NULL DEFAULT false,
    "col_b_04" BOOLEAN NOT NULL DEFAULT false,
    "col_b_05" BOOLEAN NOT NULL DEFAULT false,
    "col_b_06" BOOLEAN NOT NULL DEFAULT false,
    "col_b_07" BOOLEAN NOT NULL DEFAULT false,
    "col_b_08" BOOLEAN NOT NULL DEFAULT false,
    "col_b_09" BOOLEAN NOT NULL DEFAULT false,
    "col_b_10" BOOLEAN NOT NULL DEFAULT false,
    "col_b_11" BOOLEAN NOT NULL DEFAULT false,
    "col_n_01" INTEGER NOT NULL DEFAULT 0,
    "col_n_02" INTEGER NOT NULL DEFAULT 0,
    "col_n_03" INTEGER NOT NULL DEFAULT 0,
    "col_n_04" INTEGER NOT NULL DEFAULT 0,
    "col_n_05" INTEGER NOT NULL DEFAULT 0,
    "col_n_06" INTEGER NOT NULL DEFAULT 0,
    "col_n_07" INTEGER NOT NULL DEFAULT 0,
    "col_n_08" INTEGER NOT NULL DEFAULT 0,
    "col_n_09" INTEGER NOT NULL DEFAULT 0,
    "col_n_10" INTEGER NOT NULL DEFAULT 0,
    "col_n_11" INTEGER NOT NULL DEFAULT 0,
    "col_s_01" VARCHAR(255),
    "col_s_02" VARCHAR(255),
    "col_s_03" VARCHAR(255),
    "col_s_04" VARCHAR(255),
    "col_s_05" TEXT,
    "col_s_06" VARCHAR(255),
    "col_s_07" TEXT,
    "col_s_08" VARCHAR(255),
    "col_s_09" VARCHAR(255),
    "col_s_10" VARCHAR(255),
    "col_s_11" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_table_createdAt_idx" ON "notification_logs_table"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "notification_logs_table_tableName_idx" ON "notification_logs_table"("tableName");
