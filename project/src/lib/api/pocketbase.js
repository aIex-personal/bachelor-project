
import PocketBase from 'pocketbase';

const _url = import.meta.env.PUBLIC_POCKETBASE_URL;
export const POCKETBASE_URL = _url && _url !== '' ? _url : 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

pb.autoCancellation(false);
