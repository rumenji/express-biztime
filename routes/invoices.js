const express = require("express");
const expressError = require("../expressError");
const router = new express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows})
    } catch(err){
        return next(err)
    }
})

router.get("/:id", async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, 
        c.code, c.name, c.description FROM invoices AS i JOIN companies AS c ON i.comp_code=c.code WHERE i.id=$1`, [id])
        if(results.rows.length === 0){
            throw new expressError(`Invoice with id ${id} doesn't exist`, 404)
        }
        const data = results.rows[0];
        const invoice = {id: data.id, amt: data.amt, paid: data.paid, add_date: data.add_date, paid_date: data.paid_date, 
        company: {code: data.code, name: data.name, description: data.description}}
        return res.json({invoice: invoice})
    } catch(err){
        return next(err)
    }
})

router.post("/", async (req, res, next) => {
    try{
        const {comp_code, amt} = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]})
    } catch(err){
        return next(err)
    }
})

router.patch("/:id", async (req, res, next) => {
    try{
        const {id} = req.params;
        const {amt} = req.body;
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id])
        if(results.rows.length === 0){
            throw new expressError(`Invoice with the id ${id} doesn't exist`, 404)
        }
        return res.json({invoice: results.rows[0]})
    } catch(err){
        return next(err)
    }
})

router.delete("/:id", async (req, res, next) => {
    try{
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
        if(results.rows.length === 0){
            throw new expressError(`Invoice with the id ${id} doesn't exist`, 404)
        }
        return res.json({status: "deleted"})
    } catch(err){
        return next(err)
    }
})



module.exports = router;