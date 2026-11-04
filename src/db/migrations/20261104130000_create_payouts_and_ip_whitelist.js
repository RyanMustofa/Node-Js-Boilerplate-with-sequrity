exports.up = async function up(knex) {
  await knex.schema.createTable("ip_whitelist", (table) => {
    table.bigIncrements("id").primary();
    table.string("ip_address", 45).notNullable().unique();
    table.boolean("is_active").notNullable().defaultTo(true);
    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("payouts", (table) => {
    table.bigIncrements("id").primary();
    table.string("user_id", 191).notNullable();
    table.decimal("amount", 18, 2).notNullable();
    table.string("currency", 3).notNullable().defaultTo("USD");
    table.string("reference_id", 191).notNullable();
    table.string("status", 32).notNullable().defaultTo("queued");
    table.json("metadata").notNullable();
    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .dateTime("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index("user_id");
    table.index("reference_id");
    table.index(["status", "created_at"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("payouts");
  await knex.schema.dropTableIfExists("ip_whitelist");
};
