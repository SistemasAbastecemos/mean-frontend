// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { UserListComponent } from './app/components/user-list.component';

bootstrapApplication(UserListComponent, {
  providers: [
    provideHttpClient()
  ]
}).catch(console.error);
