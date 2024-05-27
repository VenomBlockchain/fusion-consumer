export enum TransportKind {
    mock = 'Mock',
    stdio = 'Stdio',
    http2 = 'Http2'
}

interface RpcConfig {
    listen_address: string;
    type: 'simple' | 'full';
  }
  
  interface MetricsSettings {
    listen_address: string;
    collection_interval_sec: number;
  }
  
  interface Source {
    kind: string;
    value: string;
  }
  
  interface Handler {
    kind: string;
    handler: string;
    event?: string;
  }
  
  interface DataSource {
    source: 'message' | 'contract';
    src: Source;
    handlers: Handler[];
  }
  
  interface Transport {
    kind: TransportKind;
    listen_address?: string;
  }

  enum ScanKind {
    test = 'TestJson',
    network = 'FromNetwork'
  }
  
  interface ScanType {
    kind: ScanKind;
    filename: string;
  }
  
  export interface Config {
    install_path: string;
    rpc_config: RpcConfig;
    metrics_settings: MetricsSettings;
    data_sources: DataSource[];
    transport: Transport;
    scan_type: ScanType;
  }
  

export interface MessageParam {
    name: string;
    value: string;
}

export interface Message {
    message: string;
    message_hash: string;
    message_type: MessageType;
    block_id: string;
    transaction_id: string;
    transaction_timestamp: number;
    index_in_transaction: number;
    contract_name: string;
    filter_name: string;
    params: MessageParam[];
}

export interface MessageFilter {
    type: FilterType | ContractType;
    entries: MessageEntry[];
}

export interface ContractType {
    contract: {
        name: string;
        abi_path: string;
    }
}

export interface MessageEntry {
    name: string;
    sender?: string | AddressOrCodeHash;
    receiver?: string | AddressOrCodeHash;
    message?: ContractMessage;
}

export interface ContractMessage {
    name: string;
    type: MessageType;
}

export enum MessageType {
    InternalInbound = 'internal_inbound',
    InternalOutbound = 'internal_outbound',
    ExternalInbound = 'external_inbound',
    ExternalOutbound = 'external_outbound',
}

export enum FilterType {
    AnyMessage = 'any_message',
    NativeTransfer = 'native_transfer',
}

export interface AddressOrCodeHash {
    address?: string;
    code_hash?: string;
}

export interface Block {
    id: string;
    seq_no: number;
    boc: string;
    file_hash: string;
    shard: string;
    workchain_id: number;
}