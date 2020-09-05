PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE __diesel_schema_migrations (version VARCHAR(50) PRIMARY KEY NOT NULL,run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO __diesel_schema_migrations VALUES('20200704065045','2020-07-04 08:13:35');
CREATE TABLE user (
  username VARCHAR(50) NOT NULL PRIMARY KEY,
  challenge VARCHAR(255) NOT NULL,
  answer VARCHAR(32) NOT NULL
);
INSERT INTO user VALUES('test-user','0000000002888ad6c3deab34e4bfe1e46ea668840ddedd9b1b03f368c6357a6773595137406e7ae75894b5a9d3e6c068332f0d335d1d57e0f995f9eca7','plain-answer');
COMMIT;