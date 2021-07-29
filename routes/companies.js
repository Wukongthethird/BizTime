const express = require("express");
const { NotFoundError } = require("../expressError");

const db = require("../db");

const router = new express.Router();

router.get("/", async function (req, res, next) {
  let result = await db.query(`SELECT code, name
            FROM companies`);

  return res.json({ companies: result.rows });
});

router.get("/:code", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [req.params.code]
  );
  if (result.rowCount !== 0) {
    return res.json({ company: result.rows[0] });
  }
  throw new NotFoundError();
});

module.exports = router;
