const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");

const router = new express.Router();

/* Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  let result = await db.query(`SELECT code, name
            FROM companies`);

  return res.json({ companies: result.rows });
});

/* Return obj of company: {company: {code, name, description}} */
router.get("/:code", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [req.params.code]
  );
  // if user tries to get a user that doesn't exist, NotFoundError thrown
  if (!result.rows[0]) {
    throw new NotFoundError();
  }
  return res.json({ company: result.rows[0] });
});

/* Returns obj of new company: {company: {code, name, description}} */
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;
  // if user doesn't include information, BadRequestError thrown
  if (!code || !name || !description) {
    throw new BadRequestError();
  }

  // If company code already exists in the database, BadRequest Error thrown
  try {
    await db.query(
      `INSERT INTO companies( code, name, description)
          VALUES ($1, $2, $3)
          RETURNING (code,name, description)`,
      [code, name, description]
    );
  } catch {
    throw new BadRequestError("That code already exists!");
  }
  return res.json({ company: { code, name, description } });
});

/* Returns update company object: {company: {code, name, description}} */
router.put("/:code", async function (req, res, next) {
  const { code, name, description } = req.body;

  // if user doesn't include information, BadRequestError thrown
  if (!code || !name || !description) {
    throw new BadRequestError();
  }

  let result = await db.query(
    `UPDATE companies 

        SET code = $1, 
            name = $2,
            description = $3

            WHERE code = $4
            RETURNING (code,name, description)`,
    [code, name, description, req.params.code]
  );

  /* if a user tries to update a company code that does not exist,
   NotFoundError thrown */
  if (!result.rows[0]) {
    throw new NotFoundError("The code entered does not exist");
  }

  return res.json({ company: { code, name, description } });
});

/* Returns {status: "deleted"} */
router.delete("/:code", async function (req, res, next) {
  let result = await db.query(
    `DELETE FROM companies 
        WHERE code = $1 
        RETURNING (code) `,
    [req.params.code]
  );

  /* if a user tries to update a company code that does not exist,
   NotFoundError thrown */
  if (!result.rows[0]) {
    throw new NotFoundError("The code entered already does not exist!");
  }
  return res.json({ message: "Deleted" });
});

module.exports = router;
