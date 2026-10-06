CREATE DATABASE IF NOT EXISTS membership
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE membership;

-- The app also runs this automatically on first use, so running it by hand is optional.
CREATE TABLE IF NOT EXISTS members (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,   -- e.g. STPK-26-353677 (this is what the QR code points to)
  name          VARCHAR(150) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  constituency  VARCHAR(100) NOT NULL,
  joined        DATE         NOT NULL,
  photo         MEDIUMTEXT   NULL,                   -- resized JPEG as a data URL
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
