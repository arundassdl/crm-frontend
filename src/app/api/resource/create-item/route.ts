import { NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";

const ERP_API_BASE = CONSTANTS.API_BASE_URL;
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      item_code,
      item_name,
      item_group,
      stock_uom,
      qty,
      cost_price,
      selling_price,
      meta_title,
      meta_keywords,
      meta_description,
      has_variants,
      attributes,
      image,
      company,
      taxes,
      filteredPrices,
      maintain_stock
    } = body;

    const { origin } = new URL(req.url);
    const token = req.headers.get("Authorization");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 401 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `${token}`,
    };

    // Step 1: Create Item
    const itemPayload = {
      item_code,
      item_name,
      item_group,
      stock_uom,
      is_stock_item: maintain_stock ? 1 : 0,
      show_in_website: meta_title?.trim() ? 1 : 0,
      meta_title,
      meta_keywords,
      meta_description,
      taxes,
      has_variants: has_variants ? 1 : 0,
      attributes: Object.keys(attributes || {}).map(
        (attr: string, idx: number) => ({
          attribute: attr,
          idx: idx + 1,
        })
      ),
    };

    const itemRes = await fetch(`${origin}/api/docs/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({ module: "Item", formData: itemPayload }),
    });

    const itemData = await itemRes.json();
    if (itemData.error || itemData.exc) {
      throw new Error(itemData.error || itemData.exc || "Item creation failed");
    }

    const itemCode = itemData.data?.name || item_code;

    // Step 2: Create Buying & Selling Prices
    type PricePayload = {
      item_code: string;
      price_list: string;
      price_list_rate: number;
      buying?: number;
      selling?: number;
    };

    const pricePayloads: PricePayload[] = [];
 let buying_price: number | undefined;
    if (filteredPrices && itemCode) {
      Object.entries(filteredPrices).forEach(([key, value]) => {
        const pricePayload: PricePayload = {
          item_code: itemCode,
          price_list: toTitleCase(key.replace(/_/g, ' ')), // Convert snake_case to Title Case
          price_list_rate: Number(value)
        };

        if (key.includes("buying")) {
          pricePayload.buying = 1;
        } else if (key.includes("selling")) {
          pricePayload.selling = 1;
        }

        pricePayloads.push(pricePayload);
      });
      const buyingEntry = Object.entries(filteredPrices).find(([key, _]) =>
        key.toLowerCase().includes("buying")
      );

      if (buyingEntry) {
        buying_price = Number(buyingEntry[1]);
      }

    }


    // if (cost_price) {
    //   pricePayloads.push({
    //     item_code: itemCode,
    //     price_list: "Standard Buying",
    //     price_list_rate: Number(cost_price),
    //     buying: 1,
    //   });
    // }

    // if (selling_price) {
    //   pricePayloads.push({
    //     item_code: itemCode,
    //     price_list: "Standard Selling",
    //     price_list_rate: Number(selling_price),
    //     selling: 1,
    //   });
    // }
   

    
    if (!has_variants) {
      for (const price of pricePayloads) {
        const priceRes = await fetch(`${origin}/api/docs/create`, {
          method: "POST",
          headers,
          body: JSON.stringify({ module: "Item Price", formData: price }),
        });
        const priceData = await priceRes.json();
        console.log("priceData", priceData);
      }
    }

    // Step 3: Create & Submit Stock Reconciliation

    if (
      qty &&
      company.default_warehouse_for_sales_return &&
      buying_price &&
      company &&
      !has_variants
    ) {
      const stockReconciliationDoc = {
        doctype: "Stock Reconciliation",
        company: company.name,
        purpose: "Opening Stock",
        posting_date: new Date().toISOString().slice(0, 10),
        posting_time: new Date().toISOString().slice(11, 19),
        set_posting_time: 1,
        expense_account: company.default_deferred_expense_account || "Temporary Opening - S", 
        cost_center: company.cost_center || "Main - CO",
        set_warehouse: company.default_warehouse_for_sales_return,
        items: [
          {
            item_code: itemCode,
            item_name,
            item_group,
            warehouse: company.default_warehouse_for_sales_return,
            qty: Number(qty),
            valuation_rate: Number(buying_price),
            amount: Number(qty) * Number(buying_price),
            current_qty: 0,
            current_valuation_rate: 0,
            current_amount: 0,
            quantity_difference: Number(qty),
            amount_difference: Number(qty) * Number(buying_price),
          },
        ],
      };
      console.log("stockReconciliationDoc", stockReconciliationDoc);

      const createRes = await fetch(
        `${ERP_API_BASE}/api/resource/Stock Reconciliation`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(stockReconciliationDoc),
        }
      );

      const createData = await createRes.json();
      const docName = createData?.data?.name;
      console.log("stockReconciliation createData", createData);

      //   if (docName) {
      //     const submitRes =  await fetch(`${ERP_API_BASE}/api/method/frappe.client.submit`, {
      //       method: 'POST',
      //       headers,
      //       body: JSON.stringify({
      //         doctype: 'Stock Reconciliation',
      //         name: docName,
      //       }),
      //     });
      //     const submitData = await submitRes.json();
      //     console.log("submitData",submitData);

      //   }
      if (docName) {
        // First, fetch the full doc
        const getRes = await fetch(
          `${ERP_API_BASE}/api/resource/Stock Reconciliation/${docName}`,
          {
            method: "GET",
            headers,
          }
        );

        const getData = await getRes.json();
        const fullDoc = getData?.data;

        if (fullDoc) {
          const submitRes = await fetch(
            `${ERP_API_BASE}/api/method/frappe.client.submit`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({ doc: fullDoc }), // ✅ pass full doc object
            }
          );

          const submitData = await submitRes.json();
          console.log("submitData", submitData);
        }
      }
    }

    // Step 4: Create Variants (if applicable)
    /*if (has_variants && attributes) {
      const variantRes = await fetch(
        `${origin}/api/resource/item-variants/create`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            item_code: itemCode,
            attributes,
          }),
        }
      );

      const variantData = await variantRes.json();
      if (!variantData.success) {
        return NextResponse.json({
          success: false,
          message: "Item created but variant creation failed",
          item: itemData,
          variantError: variantData,
        });
      }
    }*/
   
    
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('item_code', itemCode);
    // console.log("formDatafile=======?",JSON.stringify(file));
    // const imageRes = await fetch(`${origin}/api/resource/items/upload-image`, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `${token}`,
    //   },
    //   body: formData,
    // });
    // const imageData = await imageRes.json();
    // console.log("imageData",imageData);
    

    return NextResponse.json({
      success: true,
      message:
        "Item (with optional price, stock, and variants) created successfully",
      item: itemData,
    });
  } catch (err: any) {
    console.error("❌ Item creation error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
