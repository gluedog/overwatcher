import { map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActionList } from '@models/actions.interface';

@Injectable()
export class ChainService {
  constructor(private http: HttpClient) {}

  getHistory(account_name: string, pos: number | null, offset: number | null): Observable<ActionList> {
    let params: any = {
      account_name,
    };
    if (pos) {
      params = {
        ...params,
        pos
      }
    }
    if (offset) {
      params = {
        ...params,
        offset
      }
    }
    return this.http.post<ActionList>('https://eos.greymass.com/v1/history/get_actions', null, { params });
  }

}
