//+------------------------------------------------------------------+
//|  PropEdge Hub — MT5 Bridge EA                                    |
//|  Pushes account snapshots directly to the Next.js API.           |
//|                                                                  |
//|  SETUP (Wine / Windows):                                         |
//|  1. Copy this file to: <MT5 data folder>/MQL5/Experts/           |
//|  2. In MT5: Tools → Options → Expert Advisors                    |
//|     → tick "Allow WebRequest for listed URL"                     |
//|     → add your Next.js URL (e.g. http://localhost:3000)          |
//|  3. Compile (F7) and attach to any chart.                        |
//|  4. Set InpBridgeSecret to match MT5_BRIDGE_SECRET in .env.local |
//+------------------------------------------------------------------+
#property copyright "PropEdge Hub"
#property description "Pushes live MT5 data to PropEdge Hub dashboard"
#property version   "1.10"
#property strict

//--- Inputs
input string InpNextJsUrl    = "http://localhost:3000"; // Next.js base URL
input string InpBridgeSecret = "PropEdge_Bridge007";    // Bridge secret (match .env.local)
input int    InpPollSeconds  = 5;                        // Push interval (seconds)
input int    InpDealDays     = 1;                        // Days of deal history to include

//+------------------------------------------------------------------+
int OnInit()
{
    PrintFormat("PropEdge Hub Bridge v1.1 — pushing to %s/api/mt5/push every %ds",
                InpNextJsUrl, InpPollSeconds);
    EventSetTimer(InpPollSeconds);
    PushSnapshot(); // immediate first push
    return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("PropEdge Hub Bridge stopped.");
}

void OnTimer() { PushSnapshot(); }

//+------------------------------------------------------------------+
//| Helpers                                                          |
//+------------------------------------------------------------------+

string EscJson(string s)
{
    StringReplace(s, "\\", "\\\\");
    StringReplace(s, "\"", "\\\"");
    StringReplace(s, "\n", "\\n");
    StringReplace(s, "\r", "\\r");
    StringReplace(s, "\t", "\\t");
    return s;
}

// Format a datetime as ISO 8601 UTC ("Z" suffix).
// MT5 datetimes are UTC-based (Unix epoch seconds).
string ToISO(datetime t)
{
    MqlDateTime d;
    TimeToStruct(t, d);
    return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                        d.year, d.mon, d.day, d.hour, d.min, d.sec);
}

//+------------------------------------------------------------------+
//| Build open-positions JSON array                                  |
//+------------------------------------------------------------------+
string BuildPositions()
{
    string out = "[";
    int total = PositionsTotal();

    for (int i = 0; i < total; i++)
    {
        ulong ticket = PositionGetTicket(i);
        if (!PositionSelectByTicket(ticket)) continue;

        string sym   = EscJson(PositionGetString(POSITION_SYMBOL));
        string ptype = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "buy" : "sell";
        double vol   = PositionGetDouble(POSITION_VOLUME);
        double po    = PositionGetDouble(POSITION_PRICE_OPEN);
        double pc    = PositionGetDouble(POSITION_PRICE_CURRENT);
        double prof  = PositionGetDouble(POSITION_PROFIT);
        double swap  = PositionGetDouble(POSITION_SWAP);
        datetime ot  = (datetime)PositionGetInteger(POSITION_TIME);

        if (i > 0) out += ",";
        out += StringFormat(
            "{\"ticket\":%llu,\"symbol\":\"%s\",\"type\":\"%s\","
            "\"volume\":%.2f,\"price_open\":%.5f,\"price_current\":%.5f,"
            "\"profit\":%.2f,\"swap\":%.2f,\"time_open\":\"%s\"}",
            ticket, sym, ptype, vol, po, pc, prof, swap, ToISO(ot)
        );
    }

    out += "]";
    return out;
}

//+------------------------------------------------------------------+
//| Build closed-deals JSON array                                    |
//| Matches the DealSchema in /api/mt5/push/route.ts                 |
//+------------------------------------------------------------------+
string BuildDeals()
{
    string   out   = "[";
    bool     first = true;
    datetime from  = TimeCurrent() - (datetime)(InpDealDays * 86400);
    datetime to    = TimeCurrent() + 1;

    if (!HistorySelect(from, to))
        return "[]";

    int n = HistoryDealsTotal();

    for (int i = 0; i < n; i++)
    {
        ulong dticket = HistoryDealGetTicket(i);

        // Only OUT (close) entries
        ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dticket, DEAL_ENTRY);
        if (entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT)
            continue;

        // Skip non-trade deals (balance adjustments, credit, etc.)
        ENUM_DEAL_TYPE dtype = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dticket, DEAL_TYPE);
        if (dtype != DEAL_TYPE_BUY && dtype != DEAL_TYPE_SELL)
            continue;

        double   close_price = HistoryDealGetDouble(dticket, DEAL_PRICE);
        datetime close_time  = (datetime)HistoryDealGetInteger(dticket, DEAL_TIME);
        ulong    pos_id      = (ulong)HistoryDealGetInteger(dticket, DEAL_POSITION_ID);

        // Find the matching IN deal (same position_id) to get the open price + time
        double   open_price = close_price;
        datetime open_time  = close_time;
        for (int j = 0; j < n; j++)
        {
            ulong jt = HistoryDealGetTicket(j);
            if ((ulong)HistoryDealGetInteger(jt, DEAL_POSITION_ID) == pos_id &&
                (ENUM_DEAL_ENTRY)HistoryDealGetInteger(jt, DEAL_ENTRY) == DEAL_ENTRY_IN)
            {
                open_price = HistoryDealGetDouble(jt, DEAL_PRICE);
                open_time  = (datetime)HistoryDealGetInteger(jt, DEAL_TIME);
                break;
            }
        }

        string sym     = EscJson(HistoryDealGetString(dticket, DEAL_SYMBOL));
        string side    = (dtype == DEAL_TYPE_BUY) ? "buy" : "sell";
        double vol     = HistoryDealGetDouble(dticket, DEAL_VOLUME);
        double profit  = HistoryDealGetDouble(dticket, DEAL_PROFIT);
        double dswap   = HistoryDealGetDouble(dticket, DEAL_SWAP);
        double dcomm   = HistoryDealGetDouble(dticket, DEAL_COMMISSION);
        string comment = EscJson(HistoryDealGetString(dticket, DEAL_COMMENT));

        if (!first) out += ",";
        first = false;

        out += StringFormat(
            "{\"ticket\":%llu,\"symbol\":\"%s\",\"type\":\"%s\","
            "\"volume\":%.2f,\"price_open\":%.5f,\"price_close\":%.5f,"
            "\"profit\":%.2f,\"swap\":%.2f,\"commission\":%.2f,"
            "\"time_open\":\"%s\",\"time_close\":\"%s\",\"comment\":\"%s\"}",
            dticket, sym, side,
            vol, open_price, close_price,
            profit, dswap, dcomm,
            ToISO(open_time), ToISO(close_time), comment
        );
    }

    out += "]";
    return out;
}

//+------------------------------------------------------------------+
//| Build and POST the full snapshot                                 |
//+------------------------------------------------------------------+
void PushSnapshot()
{
    long   login   = AccountInfoInteger(ACCOUNT_LOGIN);
    string server  = EscJson(AccountInfoString(ACCOUNT_SERVER));
    double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double margin  = AccountInfoDouble(ACCOUNT_MARGIN_FREE);

    string payload = StringFormat(
        "{"
        "\"account_number\":\"%lld\","
        "\"server\":\"%s\","
        "\"equity\":%.2f,"
        "\"balance\":%.2f,"
        "\"margin_free\":%.2f,"
        "\"open_positions\":%s,"
        "\"closed_deals\":%s,"
        "\"timestamp\":\"%s\""
        "}",
        login, server,
        equity, balance, margin,
        BuildPositions(),
        BuildDeals(),
        ToISO(TimeGMT())
    );

    string url     = InpNextJsUrl + "/api/mt5/push";
    string headers = "Content-Type: application/json\r\n"
                     "X-Bridge-Secret: " + InpBridgeSecret + "\r\n";
    char   post[];
    char   result[];
    string result_headers;

    StringToCharArray(payload, post, 0, StringLen(payload), CP_UTF8);

    ResetLastError();
    int http_code = WebRequest("POST", url, headers, 5000, post, result, result_headers);

    if (http_code == -1)
    {
        int err = GetLastError();
        if (err == 4060)
            PrintFormat("⚠  WebRequest blocked. In MT5 go to:"
                        " Tools → Options → Expert Advisors"
                        " → Allow WebRequest → add: %s", InpNextJsUrl);
        else
            PrintFormat("WebRequest error %d — retrying in %ds", err, InpPollSeconds);
    }
    else if (http_code == 200 || http_code == 201)
    {
        // Silent on success — uncomment to debug:
        // Print("OK: ", CharArrayToString(result));
    }
    else
    {
        PrintFormat("API HTTP %d: %s", http_code, CharArrayToString(result));
    }
}
//+------------------------------------------------------------------+
