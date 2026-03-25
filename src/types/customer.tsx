export interface Option {
    name: string;
    value?: string;
    id: string;
    email: string;
    phone: string;
    addresses: {
      address_id: string;
      address_line1: string;
      address_type: string;
      city: string;
      state: string;
      pincode: string;
      email: string;
      phone: string;
      customerType: string;
      territory?: string;
    };
  }

  // Common base interface
  export interface BaseOption {
    name: string;
    id: string;
    email: string;
    phone: string;
    addresses: {
      address_line1: string;
      city: string;
      state: string;
      pincode: string;
    }[];
  }
  
  // AdvancedSearch version extends the base
  export interface AdvancedOption extends BaseOption {
    addresses: (BaseOption["addresses"][0] & {
      email: string;
      phone: string;
    })[];
  }
