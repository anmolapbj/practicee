import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthData } from "./auth-data.model";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })

export class AuthService {
    private token: string;
    isAutenticated = false;
    private tokenTimer: any;
    // private tokenTimer: NodeJS.Timer;
    private userId: string;
    private authStatusListener = new Subject<boolean>();

    constructor(private http: HttpClient, private router: Router) { }

    getToken() {
        return this.token;
    }

    getIsAuth() {
        return this.isAutenticated;
    }

    getUserId() {
        return this.userId;
    }
    getAuthStatusListener() {
        return this.authStatusListener.asObservable();
    }

    createUser(email: string, password: string) {
        const authData: AuthData = { email: email, password: password };
        this.http.post("http://localhost:3000/api/user/signup", authData)
            .subscribe(response => {
                console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", response);
            })

    }

    login(email: string, password: string) {
        const authData: AuthData = { email: email, password: password };
        this.http.post<{ token: string, expiresIn: number, userId: string }>("http://localhost:3000/api/user/login", authData)
            .subscribe(response => {
                const tokenI = response.token;
                this.token = tokenI;
                if (tokenI) {
                    const expiresInDuration = response.expiresIn;
                    this.setAuthTimer(expiresInDuration);
                    this.isAutenticated = true;
                    this.userId = response.userId;
                    this.authStatusListener.next(true);
                    const now = new Date();
                    const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
                    console.log(expirationDate);
                    this.saveAuthData(tokenI, expirationDate, this.userId);
                    this.router.navigate(["/"]);
                }
            })
    }

    autoAuthUser() {
        const authInformation = this.getAuthData();
        if(!authInformation) {
            return;
        }
        const now = new Date();
        const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
        if(expiresIn > 0) {
            this.token = authInformation.token;
            this.isAutenticated = true;
            this.userId = authInformation.userId;
            this.setAuthTimer(expiresIn / 1000);
            this.authStatusListener.next(true);
        }
    }

    logout() {
        this.token = null;
        this.isAutenticated = false;
        this.userId = null;
        this.authStatusListener.next(false);
        clearTimeout(this.tokenTimer);
        this.clearAuthData();
        this.router.navigate(["/login"]);
    }

    private setAuthTimer(duration: number) {
        console.log("ssssssssssssssss: " + duration);
        this.tokenTimer = setTimeout(() => {
            this.logout();
        }, duration * 1000);
    }

    private saveAuthData(token: string, expirationDate: Date, userId: string) {
        localStorage.setItem("token",token);
        localStorage.setItem("expiration",expirationDate.toISOString());
        localStorage.setItem("userId",userId);
        }

    private clearAuthData() {
        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        localStorage.removeItem("userId");
    }

    private getAuthData() {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const expirationDate = localStorage.getItem("expiration");
        if(!token && !expirationDate) {
            return;
        }
            return {
                token: token,
                expirationDate: new Date(expirationDate),
                userId: userId
            };
        
    }


}