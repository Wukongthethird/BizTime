"use strict";
const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");
// const { routes } = require("../app");

const router = new express.Router();

/* Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res, next) {
  let result = await db.query(
    `SELECT id, comp_code
        FROM invoices
        `
  );
  let invoices = result.rows;
  return res.json({ invoices });
});

/* Returns obj on given invoice or 404 if not found.

Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */
router.get("/:id", async function (req, res, next) {
  let result = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1
        `,
    [req.params.id]
  );
  let invoice = result.rows[0];
  if (!invoice) {
    throw new NotFoundError(`Invoice ${req.params.id} not found`);
  }

  let company = await db.query(
    `SELECT code, name, description
        FROM companies JOIN invoices  
        ON invoices.comp_code = companies.code
        WHERE id =$1`,
    [req.params.id]
  );

  invoice.company = company.rows[0];
  return res.json({ invoices: invoice });
});

router.post("/", async function (req, res, next) {
  let { comp_code, amt } = req.body;

  if (!comp_code || !amt) {
    // console.log("this error shouldnt be happening");
    throw new BadRequestError("You sent invalid info.");
  }
  let result = await db.query(
    `
        INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
    `,
    [comp_code, amt]
  );

  let invoice = result.rows[0];
  return res.json({ invoice });
});

router.put("/:id", async function (req, res, next) {
  let { amt } = req.body;
  let result = await db.query(
    `UPDATE invoices
         SET amt = ($1)
         WHERE id = $2
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id]
  );
  console.log(result);
  let invoice = result.rows[0];
  return res.json({ invoice });
});

module.exports = router;
