class ProfileRecord {

    //id: number = 0; // autoincrement by dexie
    key: string = '';
    name: string = '';
    display_name: string | undefined;
    description: string | undefined;
    avatar: string | undefined;
    cover: string | undefined;
    location: string | undefined;
    website: string | undefined;
    email: string | undefined;
    nip05: string | undefined;
    created_at: number = 0;
    isDefault: boolean = false;
}

export default ProfileRecord;

