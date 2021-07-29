const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

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
  if (result.rowCount === 0) {
    throw new NotFoundError();
  }
  return res.json({ company: result.rows[0] });
});

router.post("/", async function (req, res, next) {
    
    const { code, name , description} = req.body;

    if( !code || !name || !description){
        throw new BadRequestError()
    }
    let result = await db.query(
      `INSERT INTO companies( code, name, description)
      VALUES ($1, $2, $3)
      RETURNING (code,name, description)`,
      [code , name ,description]
    );
    return res.json({ company: { code, name , description}});
  });

router.put("/:code", async function (req, res, next) {
    
    const { code, name , description} = req.body;

    if( !code || !name || !description){
        throw new BadRequestError()
    }

    let result = await db.query(
      `UPDATE companies 

        SET code = $1, 
            name = $2,
            description = $3

            WHERE code = $4
            RETURNING (code,name, description)`,
      [code , name ,description, req.params.code]
    );
    return res.json({ company: { code, name , description}});
  });

router.delete("/:code", async function(req,res,next){
    await db.query(

        `DELETE FROM companies 
        WHERE code = $1 
        RETURNING (code) `,
        [req.params.code]
    )
    return res.json({ message: "Deleted" });
})


module.exports = router;
