'use server'

import { cookies } from 'next/headers'

export async function deleteCookie (data) {
    console.log("datadatadata",data);
    
    // const oneDay = 24 * 60 * 60
    const oneDay =  60
    cookies().set(data['name'], JSON.parse(data['value']), { expires: Date.now() - oneDay })
}