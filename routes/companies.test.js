process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function(){
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('msoft', 'Microsoft', 'Creator of Windows') RETURNING code, name, description`);
    testCompany = result.rows[0];
})

afterEach(async function(){
    await db.query(`DELETE FROM companies`);
})

afterAll(async function(){
    await db.end();
})

describe("Get /companies", function(){
    test("Get all companies", async function(){
        const response = await request(app).get("/companies");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testCompany]
        })
    })
})

describe("Get /companies/:id", function(){
    test("Get specific company", async function(){
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        testCompany['invoices'] = []
        expect(response.body).toEqual({company: testCompany})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/companies/99`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Can't find company with the code 99",
            "status": 404}, "message": "Can't find company with the code 99",})
    })
})

describe("Create /companies", function(){
    test("Create company", async function(){
        const response = await request(app).post(`/companies`).send({code: "adobe", name: "Adobe", description: "Creator of Photoshop"});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({company: {code: "adobe", name: "Adobe", description: "Creator of Photoshop"}})
    })
})

describe("Patch /companies/:id", function(){
    test("Update specific company", async function(){
        const response = await request(app).patch(`/companies/${testCompany.code}`).send({name: "Microsoft", description: "Creator of Windows and Office"});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: {code: "msoft", name: "Microsoft", description: "Creator of Windows and Office"}})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/companies/99`).send({name: "Microsoft", description: "Creator of Windows and Office"});
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Can't find company with the code 99",
            "status": 404}, "message": "Can't find company with the code 99",})
    })
})

describe("Delete /companies/:id", function(){
    test("Delete specific company", async function(){
        const response = await request(app).delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"})
    })
    test("Not found", async function(){
        const response = await request(app).get(`/companies/99`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({"error": {
            "message": "Can't find company with the code 99",
            "status": 404}, "message": "Can't find company with the code 99",})
    })
})