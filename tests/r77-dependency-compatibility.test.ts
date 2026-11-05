import assert from "node:assert/strict";
import test from "node:test";

test("patched image optimizer dependency decodes and resizes PNG input", async () => {
  const { default: sharp } = await import("sharp");
  const source = await sharp({
    create: { width: 4, height: 4, channels: 4, background: "#336699ff" },
  }).png().toBuffer();
  const output = await sharp(source).resize(2, 2).webp().toBuffer();
  const metadata = await sharp(output).metadata();

  assert.equal(metadata.width, 2);
  assert.equal(metadata.height, 2);
  assert.equal(metadata.format, "webp");
});

test("patched Swiper release retains the imports used by ImageGallery", async () => {
  const reactExports = await import("swiper/react");
  const moduleExports = await import("swiper/modules");

  assert.ok(reactExports.Swiper);
  assert.ok(reactExports.SwiperSlide);
  assert.ok(moduleExports.Navigation);
});

test("patched Axios retains request serialization without following a network redirect", async () => {
  const { default: axios } = await import("axios");
  const response = await axios.request({
    url: "/api/frappe/list/CRM Lead",
    method: "post",
    data: { filters: [["status", "=", "Open"]] },
    adapter: async config => ({
      config,
      data: config.data,
      headers: config.headers,
      status: 200,
      statusText: "OK",
    }),
  });

  assert.deepEqual(response.data.filters, [["status", "=", "Open"]]);
  assert.match(String(response.config.headers?.getContentType()), /application\/json/i);
});
