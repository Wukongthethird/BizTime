"use strict"
const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");


const db = require("../db");

const router = new express.Router();

router.get("/", async function(req ,res, next){
    let result = await db.query( 
        `SELECT id, comp_code
        FROM invoices
        `
    )
    let invoices = result.rows
    return res.json( {invoices} )

} )

router.get("/:id", async function(req ,res, next){

    let result = await db.query( 
        `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1
        `,
        [req.params.id]
    )
    let invoice = result.rows[0]
    if(!invoice){
         throw new NotFoundError(`Invoice ${req.params.id} not found`)}

    let company = await db.query(
        `SELECT code, name, description
        FROM companies JOIN invoices  
        ON invoices.comp_code = companies.code
        WHERE id =$1`,[req.params.id]
    )
    
    invoice.company = company.rows[0]
    return res.json( {invoices:invoice} )
} )





module.exports = router;