export interface Authorization {
  actor: string;
  permission: string;
}

export interface Data {
  from: string;
  memo: string;
  quantity: string;
  to: string;
}

export interface Act {
  account: string;
  authorization: Authorization[];
  data: Data;
  hex_data: string;
  name: string;
}

export interface Receipt {
  abi_sequence: number;
  act_digest: string;
  auth_sequence: any[][];
  code_sequence: number;
  global_sequence: any;
  receiver: string;
  recv_sequence: number;
}

export interface ActionTrace {
  account_ram_deltas: any[];
  act: Act;
  action_ordinal: number;
  block_num: number;
  block_time: Date;
  closest_unnotified_ancestor_action_ordinal: number;
  context_free: boolean;
  creator_action_ordinal: number;
  elapsed: number;
  producer_block_id: string;
  receipt: Receipt;
  receiver: string;
  trx_id: string;
}

export interface Action {
  account_action_seq: number;
  action_trace: ActionTrace;
  block_num: number;
  block_time: Date;
  global_action_seq: any;
  irreversible: boolean;
  type: string;
  isBot: boolean;
  isNewdex: boolean;
  isBuy: boolean;
  isSell: boolean;
}

export interface ActionList {
  actions: Action[];
  head_block_num: number;
  last_irreversible_block: number;
}
