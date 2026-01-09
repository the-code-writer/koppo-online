declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  }
  
  export class GoogleAuthProvider {
    static credentialFromResult(result: any): any;
  }
  
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export function signOut(auth: any): Promise<void>;
}
