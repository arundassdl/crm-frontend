import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

const MultiLangApiFetch = async () => {
  // R55: tenant Frappe CRM sites (reached through /api/proxy) do not have the
  // SalesBond translation API, so the shared frontend runs English-only there.
  if (CONSTANTS.API_BASE_URL === '/api/proxy') return [];
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_languages';
  const entity = 'translation';
  const params = `?version=${version}&method=${method}&entity=${entity}`;

  const MultiLanguagesList = await axios
    .get(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`, {
      timeout: 5000,
    })
    .then((res: any) => {
      console.log('multilanguage list', res?.data?.message);
      return res?.data?.message;
    })
    .catch((err: any) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });

    const MultiLanguagesListApi =  fetch(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`, {
      headers: {
        // Authorization: `Bearer ${userToken?.access_token}`,
      },
      cache: "force-cache",
    }).then((res: any) => {
      console.log('MultiLanguagesListApi list', res?.data?.message);
      return res?.data?.message;
    })
    .catch((err: any) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });

  console.log("MultiLanguagesListApi", MultiLanguagesListApi);

  const langTransmethod = 'get_translation_text';
  const langTransentity = 'translation';

  if (!Array.isArray(MultiLanguagesList)) return [];

  const generateMultiLingualArrayOfData = await Promise.all(
    MultiLanguagesList.map(async (lang: any) => {
      console.log('MultiLanguagesList langname', lang);

      try {
        const res = await axios.get(
          `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${langTransmethod}&entity=${langTransentity}&language_code=${lang.language_code}`,
          { timeout: 5000 }
        );
        console.log('Translation text for', lang.language_name, res?.data?.message);

        return {
          lang_name: lang.language_name,
          lang_code: lang.language_code,
          value: res?.data?.message,
        };
      } catch (err: any) {
        if (err.code === 'ECONNABORTED') {
          console.error(`Timeout fetching translation for ${lang.language_name}`);
        } else if (err.code === 'ERR_BAD_REQUEST') {
          console.error(`Bad request for ${lang.language_name}`);
        } else if (err.code === 'ERR_INVALID_URL') {
          console.error(`Invalid URL for ${lang.language_name}`);
        } else {
          console.error('Error fetching translation:', err);
        }
        // Return an empty object for the errored language
        return {
          lang_name: lang.language_name,
          lang_code: lang.language_code,
          value: 'Error fetching translation',
        };
      }
    })
  );

  return generateMultiLingualArrayOfData;
};


const MultiLangApi = async () => {
  // R55: see MultiLangApiFetch — no translation API on tenant CRM sites.
  if (CONSTANTS.API_BASE_URL === '/api/proxy') return [];
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_languages';
  const entity = 'translation';
  const params = `?version=${version}&method=${method}&entity=${entity}`;

  const MultiLanguagesList = await axios
    .get(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`, {
      timeout: 5000,
    })
    .then((res: any) => {
      console.log('multilanguage list', res?.data?.message);
      return res?.data?.message;
    })
    .catch((err: any) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });

  console.log("MultiLanguagesList", MultiLanguagesList);

  const langTransmethod = 'get_translation_text';
  const langTransentity = 'translation';

  if (!Array.isArray(MultiLanguagesList)) return [];

  const generateMultiLingualArrayOfData = await Promise.all(
    MultiLanguagesList.map(async (lang: any) => {
      console.log('MultiLanguagesList langname', lang);

      try {
        const res = await axios.get(
          `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${langTransmethod}&entity=${langTransentity}&language_code=${lang.language_code}`,
          { timeout: 5000 }
        );
        console.log('Translation text for', lang.language_name, res?.data?.message);

        return {
          lang_name: lang.language_name,
          lang_code: lang.language_code,
          value: res?.data?.message,
        };
      } catch (err: any) {
        if (err.code === 'ECONNABORTED') {
          console.error(`Timeout fetching translation for ${lang.language_name}`);
        } else if (err.code === 'ERR_BAD_REQUEST') {
          console.error(`Bad request for ${lang.language_name}`);
        } else if (err.code === 'ERR_INVALID_URL') {
          console.error(`Invalid URL for ${lang.language_name}`);
        } else {
          console.error('Error fetching translation:', err);
        }
        // Return an empty object for the errored language
        return {
          lang_name: lang.language_name,
          lang_code: lang.language_code,
          value: 'Error fetching translation',
        };
      }
    })
  );

  return generateMultiLingualArrayOfData;
};

export default MultiLangApi;
