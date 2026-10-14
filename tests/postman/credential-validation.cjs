/* global pm */
pm.test("Invalid credentials return 422", function () { pm.response.to.have.status(422); });
pm.test("Field validation uses the API error envelope", function () {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(false);
  pm.expect(body.error.code).to.eql("VALIDATION_ERROR");
  pm.expect(body.error.details.email).to.be.an("array");
  pm.expect(body.error.details.password).to.be.an("array");
});
pm.test("Responses are not cached or given auth cookies", function () {
  pm.expect(pm.response.headers.get("Cache-Control")).to.eql("no-store");
  pm.expect(pm.response.headers.get("Set-Cookie")).to.eql(undefined);
});
