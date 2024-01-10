process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeEach(async function(){
    const resultComp = await db.query(`INSERT INTO companies (code, name, description) VALUES ('msoft', 'Microsoft', 'Creator of Windows') RETURNING code, name, description`);
    testCompany = resultComp.rows[0];
    const resultInv = await db.query(`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
    VALUES ('msoft', 50, false, '2024-01-10', null) RETURNING id`);
    testInvoice = resultInv.rows[0];
})

afterEach(async function(){
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
})

afterAll(async function(){
    await db.end();
})

describe("Get /invoices", function(){
    test("Get all invoices", async function(){
        const response = await request(app).get("/invoices");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [{id: expect.any(Number),
                amt: 50,
                comp_code: 'msoft',
                add_date: '2024-01-10T05:00:00.000Z',
                paid: false,
                paid_date: null}]
        })
    })
})

describe("Get /invoices/:id", function(){
    test("Get specific invoice", async function(){
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        const invoice = {
            id: expect.any(Number),
            amt: 50,
            add_date: '2024-01-10T05:00:00.000Z',
            paid: false,
            paid_date: null,
            company: {
              code: 'msoft',
              name: 'Microsoft',
              description: 'Creator of Windows'
            }
          }
        expect(response.body).toEqual({invoice: invoice})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/invoices/99`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Invoice with id 99 doesn't exist",
            "status": 404}, "message": "Invoice with id 99 doesn't exist",})
    })
})

describe("Create /invoices", function(){
    test("Create invoice", async function(){
        const response = await request(app).post(`/invoices`).send({amt: 30, comp_code: 'msoft'});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({invoice: {id: expect.any(Number), comp_code: "msoft", amt: 30, add_date: expect.any(String), paid: false, paid_date: null}})
    })
})

describe("Patch /invoices/:id", function(){
    test("Update specific invoice", async function(){
        const response = await request(app).patch(`/invoices/${testInvoice.id}`).send({amt: 10, code: 'msoft'});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({invoice: {id: expect.any(Number), comp_code: "msoft", amt: 10, add_date: expect.any(String), paid: false, paid_date: null}})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/invoices/99`).send({name: "Microsoft", description: "Creator of Windows and Office"});
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Invoice with id 99 doesn't exist",
            "status": 404}, "message": "Invoice with id 99 doesn't exist",})
    })
})

describe("Delete /invoices/:id", function(){
    test("Delete specific invoice", async function(){
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/invoices/99`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Invoice with id 99 doesn't exist",
            "status": 404}, "message": "Invoice with id 99 doesn't exist",})
    })
})