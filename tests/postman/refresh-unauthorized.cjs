/* global pm */
pm.test("Refresh without a token returns 401", function () {
  pm.response.to.have.status(401);
});
pm.test("Uses the shared error envelope without exposing tokens", function () {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(false);
  pm.expect(body.error.code).to.eql("INVALID_REFRESH_TOKEN");
  pm.expect(body).not.to.have.property("data");
});
pm.test("Authentication responses cannot be cached", function () {
  pm.expect(pm.response.headers.get("Cache-Control")).to.eql("no-store");
});
pm.test("Invalid browser session clears the refresh cookie", function () {
  pm.expect(pm.response.headers.get("Set-Cookie")).to.include("Max-Age=0");
});
