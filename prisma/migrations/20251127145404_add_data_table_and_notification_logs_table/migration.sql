-- CreateTable
CREATE TABLE "data_table" (
    "id" SERIAL NOT NULL,
    "col_s_01" TEXT,
    "col_s_02" TEXT,
    "col_s_03" TEXT,
    "col_s_04" TEXT,
    "col_s_05" TEXT,
    "col_s_06" TEXT,
    "col_s_07" TEXT,
    "col_s_08" TEXT,
    "col_s_09" TEXT,
    "col_s_10" TEXT,
    "col_s_11" TEXT,
    "col_n_01" INTEGER,
    "col_n_02" INTEGER,
    "col_n_03" INTEGER,
    "col_n_04" INTEGER,
    "col_n_05" INTEGER,
    "col_n_06" INTEGER,
    "col_n_07" INTEGER,
    "col_n_08" INTEGER,
    "col_n_09" INTEGER,
    "col_n_10" INTEGER,
    "col_n_11" INTEGER,
    "col_b_01" BOOLEAN,
    "col_b_02" BOOLEAN,
    "col_b_03" BOOLEAN,
    "col_b_04" BOOLEAN,
    "col_b_05" BOOLEAN,
    "col_b_06" BOOLEAN,
    "col_b_07" BOOLEAN,
    "col_b_08" BOOLEAN,
    "col_b_09" BOOLEAN,
    "col_b_10" BOOLEAN,
    "col_b_11" BOOLEAN,

    CONSTRAINT "data_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs_table" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "table_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "notification_logs_table_pkey" PRIMARY KEY ("id")
);
