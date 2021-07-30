"use strict";
const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");

const router = new express.Router();

/* Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name
        FROM companies`
  );

  return res.json({ companies: result.rows });
});

/* Return obj of company: {company: {code, name, description,
    invoices[id,......]}} */
router.get("/:code", async function (req, res, next) {
  let result = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [req.params.code]
  );
  // if user tries to get a company that doesn't exist, NotFoundError thrown
  let company = result.rows[0];
  if (!company) {
    //let them know if the company doesnt exist
    throw new NotFoundError(`Company not found: ${code}`);
  }

  let invoices = await db.query(
    `SELECT id 
    FROM invoices 
    JOIN companies on
    invoices.comp_code = companies.code
    WHERE companies.code = $1
    `, [req.params.code]
  );
  company.invoices = invoices.rows.map(invoice => invoice.id)
  
  return res.json({ company});
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
          RETURNING code,name, description`,
      [code, name, description]
    );
  } catch {
    throw new BadRequestError("That code already exists!");
  }
  return res.status(201).json({ company: { code, name, description } });
});

/* Returns update company object: {company: {code, name, description}} */
router.put("/:code", async function (req, res, next) {
  const { name, description } = req.body;

  // if user doesn't include information, BadRequestError thrown
  if (!name || !description) {
    throw new BadRequestError();
  }

  let result = await db.query(
    `UPDATE companies 
        SET name = $2,
            description = $3
            WHERE code = $1
            RETURNING code,name, description`,
    [req.params.code, name, description]
  );
  let company = result.rows[0];
  /* if a user tries to update a company code that does not exist,
     NotFoundError thrown */
  if (!company) {
    throw new NotFoundError(`Company not found: ${code}`);
  }
  //safer to return information supply from the db
  return res.json({ company });
});

/* Returns {status: "deleted"} */
router.delete("/:code", async function (req, res, next) {
  let result = await db.query(
    `DELETE FROM companies 
        WHERE code = $1 
        RETURNING code `,
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
