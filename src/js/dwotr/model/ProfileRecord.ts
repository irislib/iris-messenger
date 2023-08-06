class ProfileRecord {

    //id: number = 0; // autoincrement by dexie
    key: string = '';
    name: string = '';
    username: string = '';
    displayName: string | undefined;
    display_name: string | undefined;
    description: string | undefined;
    avatar: string | undefined;
    picture: string | undefined;
    cover: string | undefined;
    location: string | undefined;
    website: string | undefined;
    email: string | undefined;
    nip05: string | undefined;
    lud16: string | undefined;
    lud06: string | undefined;
    about: string | undefined;
    created_at: number = 0;
    isDefault: boolean = false;
}

export default ProfileRecord;


export type ProfileMemory = ProfileRecord & { id: number };