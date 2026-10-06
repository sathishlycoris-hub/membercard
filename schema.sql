CREATE DATABASE IF NOT EXISTS membership
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE membership;

-- The app also runs this automatically on first use (and adds new columns to an
-- older table), so running it by hand is optional.
CREATE TABLE IF NOT EXISTS members (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,   -- e.g. STPK-26-353677 (what the QR code points to)
  name          VARCHAR(150) NOT NULL,
  location      VARCHAR(200) NULL,
  dob           DATE         NULL,
  phone         VARCHAR(15)  NULL,
  state         VARCHAR(100) NOT NULL,
  constituency  VARCHAR(100) NOT NULL,
  joined        DATE         NOT NULL,
  photo         MEDIUMTEXT   NULL,                   -- resized JPEG as a data URL
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aadhaar and Voter ID attachments (image or PDF, stored as data URLs)
CREATE TABLE IF NOT EXISTS member_documents (
  member_id   VARCHAR(20) NOT NULL,
  kind        ENUM('aadhaar','voter') NOT NULL,
  data        LONGTEXT    NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, kind),
  CONSTRAINT fk_doc_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
