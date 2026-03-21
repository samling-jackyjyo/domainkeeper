import { connect } from 'cloudflare:sockets';

// 在文件顶部添加版本信息后台密码（不可为空）
const VERSION = "1.7.1";
const COPYRIGHT_TEXT = "© 2023-2026 bacon159. All rights reserved.";
const GITHUB_REPO_URL = "https://github.com/ypq123456789/domainkeeper";
const GITHUB_STARS_URL = `${GITHUB_REPO_URL}/stargazers`;
const CORN_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#f8fafc"/>
  <path d="M18 48c4-13 2-27 14-34 12 7 10 21 14 34-7-4-10-3-14 0-4-3-7-4-14 0Z" fill="#22c55e"/>
  <path d="M26 18c0-4 3-8 6-8s6 4 6 8v19c0 4-3 8-6 8s-6-4-6-8V18Z" fill="#facc15"/>
  <circle cx="29" cy="19" r="2" fill="#fde68a"/>
  <circle cx="35" cy="19" r="2" fill="#fde68a"/>
  <circle cx="29" cy="25" r="2" fill="#fde68a"/>
  <circle cx="35" cy="25" r="2" fill="#fde68a"/>
  <circle cx="29" cy="31" r="2" fill="#fde68a"/>
  <circle cx="35" cy="31" r="2" fill="#fde68a"/>
  <circle cx="29" cy="37" r="2" fill="#fde68a"/>
  <circle cx="35" cy="37" r="2" fill="#fde68a"/>
</svg>`;

// 自定义标题
const CUSTOM_TITLE = "培根的玉米大全";

// 在这里设置你的 Cloudflare API Token
const CF_API_KEY_DEFAULT = "";
let CF_API_KEY = CF_API_KEY_DEFAULT;

// 自建 WHOIS 代理服务地址
const WHOIS_PROXY_URL_DEFAULT = "https://whois.0o11.com";
let WHOIS_PROXY_URL = WHOIS_PROXY_URL_DEFAULT;
const ENABLE_WHOIS_PROXY_FALLBACK_DEFAULT = false;
let ENABLE_WHOIS_PROXY_FALLBACK = ENABLE_WHOIS_PROXY_FALLBACK_DEFAULT;
const WHOIS_PROXY_PREFERRED_TLDS_DEFAULT = ['uy'];
let WHOIS_PROXY_PREFERRED_TLDS = new Set(WHOIS_PROXY_PREFERRED_TLDS_DEFAULT);
const APIHZ_USER_ID_DEFAULT = "";
let APIHZ_USER_ID = APIHZ_USER_ID_DEFAULT;
const APIHZ_KEY_DEFAULT = "";
let APIHZ_KEY = APIHZ_KEY_DEFAULT;
const APIHZ_FORMATTED_URL_DEFAULT = "https://cn.apihz.cn/api/wangzhan/whois.php";
let APIHZ_FORMATTED_URL = APIHZ_FORMATTED_URL_DEFAULT;
const APIHZ_RAW_URL_DEFAULT = "https://cn.apihz.cn/api/wangzhan/whoisall.php";
let APIHZ_RAW_URL = APIHZ_RAW_URL_DEFAULT;
const APIHZ_PREFERRED_TLDS_DEFAULT = ['ua'];
let APIHZ_PREFERRED_TLDS = new Set(APIHZ_PREFERRED_TLDS_DEFAULT);
const ONEFOUR_LOOKUP_URL_DEFAULT = "https://yisi.yun/api/lookup";
let ONEFOUR_LOOKUP_URL = ONEFOUR_LOOKUP_URL_DEFAULT;
const ONEFOUR_LOOKUP_PREFERRED_TLDS_DEFAULT = ['uy'];
let ONEFOUR_LOOKUP_PREFERRED_TLDS = new Set(ONEFOUR_LOOKUP_PREFERRED_TLDS_DEFAULT);
const WHOIS_CACHE_TTL_MS = 60 * 60 * 1000;
const WHOIS_CACHE_SCHEMA_VERSION = 11;
const WHOIS_ERROR_RETRY_MS = 10 * 60 * 1000;
const WHOIS_PORT = 43;
const WHOIS_QUERY_TIMEOUT_MS = 15000;
const WHOIS_MAX_RESPONSE_BYTES = 256 * 1024;
const WHOIS_LOOKUP_MEMO_TTL_MS = 5 * 60 * 1000;

const ACCESS_PASSWORD_DEFAULT = "";
let ACCESS_PASSWORD = ACCESS_PASSWORD_DEFAULT;
const DONATE_URL_DEFAULT = "";
let DONATE_URL = DONATE_URL_DEFAULT;

const ADMIN_PASSWORD_DEFAULT = "";
let ADMIN_PASSWORD = ADMIN_PASSWORD_DEFAULT;
const TENCENTCLOUD_SECRET_ID_DEFAULT = "";
let TENCENTCLOUD_SECRET_ID = TENCENTCLOUD_SECRET_ID_DEFAULT;
const TENCENTCLOUD_SECRET_KEY_DEFAULT = "";
let TENCENTCLOUD_SECRET_KEY = TENCENTCLOUD_SECRET_KEY_DEFAULT;
const TENCENTCLOUD_DNSPOD_HOST = "dnspod.tencentcloudapi.com";
const TENCENTCLOUD_DNSPOD_SERVICE = "dnspod";
const TENCENTCLOUD_DNSPOD_ACTION = "DescribeDomainWhois";
const TENCENTCLOUD_DNSPOD_VERSION = "2021-03-23";

let KV_NAMESPACE = null;
const WHOIS_LOOKUP_MEMO = new Map();
const TEXT_ENCODER = new TextEncoder();
// footerHTML
const footerHTML = `
  <footer style="
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: #f8f9fa;
    color: #6c757d;
    text-align: center;
    padding: 10px 0;
    font-size: 14px;
  ">
    Powered by DomainKeeper v${VERSION} <span style="margin: 0 10px;">|</span> ${COPYRIGHT_TEXT}
  </footer>
`;

export default {
  async fetch(request, env) {
    applyRuntimeBindings(env);
    return handleRequest(request);
  }
};

function applyRuntimeBindings(env) {
  CF_API_KEY = env.CF_API_KEY || CF_API_KEY_DEFAULT;
  ACCESS_PASSWORD = env.ACCESS_PASSWORD || ACCESS_PASSWORD_DEFAULT;
  DONATE_URL = String(env.DONATE_URL || DONATE_URL_DEFAULT).trim();
  ADMIN_PASSWORD = env.ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT;
  TENCENTCLOUD_SECRET_ID = String(env.TENCENTCLOUD_SECRET_ID || TENCENTCLOUD_SECRET_ID_DEFAULT).trim();
  TENCENTCLOUD_SECRET_KEY = String(env.TENCENTCLOUD_SECRET_KEY || TENCENTCLOUD_SECRET_KEY_DEFAULT).trim();
  WHOIS_PROXY_URL = normalizeConfiguredUrl(env.WHOIS_PROXY_URL) || WHOIS_PROXY_URL_DEFAULT;
  ENABLE_WHOIS_PROXY_FALLBACK = parseBooleanEnv(env.ENABLE_WHOIS_PROXY_FALLBACK, ENABLE_WHOIS_PROXY_FALLBACK_DEFAULT);
  WHOIS_PROXY_PREFERRED_TLDS = parseListEnv(env.WHOIS_PROXY_PREFERRED_TLDS, WHOIS_PROXY_PREFERRED_TLDS_DEFAULT);
  APIHZ_USER_ID = String(env.APIHZ_USER_ID || APIHZ_USER_ID_DEFAULT).trim();
  APIHZ_KEY = String(env.APIHZ_KEY || APIHZ_KEY_DEFAULT).trim();
  APIHZ_FORMATTED_URL = normalizeConfiguredUrl(env.APIHZ_FORMATTED_URL) || APIHZ_FORMATTED_URL_DEFAULT;
  APIHZ_RAW_URL = normalizeConfiguredUrl(env.APIHZ_RAW_URL) || APIHZ_RAW_URL_DEFAULT;
  APIHZ_PREFERRED_TLDS = parseListEnv(env.APIHZ_PREFERRED_TLDS, APIHZ_PREFERRED_TLDS_DEFAULT);
  ONEFOUR_LOOKUP_URL = normalizeConfiguredUrl(env.ONEFOUR_LOOKUP_URL) || ONEFOUR_LOOKUP_URL_DEFAULT;
  ONEFOUR_LOOKUP_PREFERRED_TLDS = parseListEnv(env.ONEFOUR_LOOKUP_PREFERRED_TLDS, ONEFOUR_LOOKUP_PREFERRED_TLDS_DEFAULT);
  KV_NAMESPACE = env.DOMAIN_INFO || null;
  if (!KV_NAMESPACE) {
    throw new Error('Missing DOMAIN_INFO binding');
  }
}

function normalizeConfiguredUrl(value) {
  const normalized = String(value || '').trim();
  return normalized || '';
}

function parseBooleanEnv(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseListEnv(value, defaultValues) {
  const source = value === undefined || value === null || value === ''
    ? defaultValues
    : String(value).split(',');

  return new Set(
    source
      .map(item => String(item || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

async function handleRequest(request) {
   const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/manual-query") {
    return handleManualQuery(request);
  }

  if (path === "/") {
    return handleFrontend(request);
  } else if (path === "/admin") {
    return handleAdmin(request);
  } else if (path === "/api/update") {
    return handleApiUpdate(request);
  } else if (path === "/login") {
    return handleLogin(request);
  } else if (path === "/admin-login") {
    return handleAdminLogin(request);
  } else if (path === "/favicon.svg" || path === "/favicon.ico") {
    return new Response(CORN_FAVICON_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=UTF-8",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } else if (path.startsWith("/whois/")) {
    const domain = path.split("/")[2];
    return handleWhoisRequest(domain);
  } else {
    return new Response("Not Found", { status: 404 });
  }
}

async function handleManualQuery(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const data = await request.json();
  const { domain, apiKey } = data;

  try {
    const whoisInfo = await fetchWhoisInfo(domain, apiKey);
    await cacheWhoisInfo(domain, whoisInfo);
    return new Response(JSON.stringify(whoisInfo), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cleanupKV() {
  const list = await KV_NAMESPACE.list();
  for (const key of list.keys) {
    const value = await KV_NAMESPACE.get(key.name);
    if (value) {
      try {
        const { data } = JSON.parse(value);
        if (data.whoisError) {
          await KV_NAMESPACE.delete(key.name);
        }
      } catch (error) {
        console.error(`Error parsing data for ${key.name}:`, error);
      }
    }
  }
}

async function handleFrontend(request) {
  const cookie = request.headers.get("Cookie");
  if (ACCESS_PASSWORD && (!cookie || !cookie.includes(`access_token=${ACCESS_PASSWORD}`))) {
    return Response.redirect(`${new URL(request.url).origin}/login`, 302);
  }

  console.log("Fetching Cloudflare domains info...");
  const domains = await fetchCloudflareDomainsInfo();
  console.log("Cloudflare domains:", domains);

  console.log("Fetching domain info from Cloudflare + KV cache...");
  const domainsWithInfo = await fetchDomainInfo(domains, { allowWhoisRefresh: false });
  console.log("Domains with info:", domainsWithInfo);

  return new Response(generateHTML(domainsWithInfo, false), {
    headers: { 'Content-Type': 'text/html' },
  });
}

async function handleAdmin(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie || !cookie.includes(`admin_token=${ADMIN_PASSWORD}`)) {
    return Response.redirect(`${new URL(request.url).origin}/admin-login`, 302);
  }

  const domains = await fetchCloudflareDomainsInfo();
  const domainsWithInfo = await fetchDomainInfo(domains, { allowWhoisRefresh: false });
  return new Response(generateHTML(domainsWithInfo, true), {
    headers: { 'Content-Type': 'text/html' },
  });
}

async function handleLogin(request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");
    
    if (password === ACCESS_PASSWORD) {
      return new Response("Login successful", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `access_token=${ACCESS_PASSWORD}; HttpOnly; Path=/; SameSite=Strict`
        }
      });
    } else {
      return new Response(generateLoginHTML("前台登录", "/login", "密码错误，请重试。"), {
        headers: { "Content-Type": "text/html" },
        status: 401
      });
    }
  }
  return new Response(generateLoginHTML("前台登录", "/login"), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleAdminLogin(request) {
  console.log("Handling admin login request");
  console.log("Request method:", request.method);

  if (request.method === "POST") {
    console.log("Processing POST request for admin login");
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === ADMIN_PASSWORD) {
      return new Response("Admin login successful", {
        status: 302,
        headers: {
          "Location": "/admin",
          "Set-Cookie": `admin_token=${ADMIN_PASSWORD}; HttpOnly; Path=/; SameSite=Strict`
        }
      });
    } else {
      return new Response(generateLoginHTML("后台登录", "/admin-login", "密码错误，请重试。"), {
        headers: { "Content-Type": "text/html" },
        status: 401
      });
    }
  }

  return new Response(generateLoginHTML("后台登录", "/admin-login"), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleApiUpdate(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth || auth !== `Basic ${btoa(`:${ADMIN_PASSWORD}`)}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      action,
      domain,
      system,
      registrar,
      registrationDate,
      expirationDate,
      parentRegistrationDate,
      parentExpirationDate,
      secondLevelRegistrationDate,
      secondLevelExpirationDate
    } = data;

    if (action === 'delete') {
      // 删除自定义域名
      await KV_NAMESPACE.delete(`whois_${domain}`);
    } else if (action === 'update-whois') {
      // 更新 WHOIS 信息
      const cachedInfo = await getCachedWhoisInfo(domain) || { domain };
      const whoisInfo = await fetchWhoisInfo(domain);
      const mergedInfo = mergeWhoisInfoWithFallback(cachedInfo, whoisInfo);
      await cacheWhoisInfo(domain, mergedInfo);
    } else if (action === 'add') {
      // 添加新域名
      const newDomainInfo = {
        domain,
        system,
        registrar,
        registrationDate,
        expirationDate,
        parentRegistrationDate,
        parentExpirationDate,
        secondLevelRegistrationDate,
        secondLevelExpirationDate,
        isCustom: true
      };
      await cacheWhoisInfo(domain, newDomainInfo);
    } else if (action === 'reset-custom') {
      // 重置域名的自定义标记
      const domainInfo = await getCachedWhoisInfo(domain);
      if (domainInfo) {
        domainInfo.isCustom = false;
        await cacheWhoisInfo(domain, domainInfo);
      }
    } else if (action === 'get-props') {
      // 获取域名属性
      const domainInfo = await getCachedWhoisInfo(domain);
      if (domainInfo) {
        return new Response(JSON.stringify({
          success: true,
          props: domainInfo
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '找不到域名'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (action === 'sync-cloudflare') {
      // 同步Cloudflare域名
      const cfDomains = await fetchCloudflareDomainsInfo();
      
      // 获取域名列表以显示
      const domainNamesList = cfDomains.map(d => d.domain);
      
      // 获取KV中所有域名
      const allDomainKeys = await KV_NAMESPACE.list({ prefix: 'whois_' });
      
      // 处理KV中的域名
      for (const key of allDomainKeys.keys) {
        const domainName = key.name.replace('whois_', '');
        const domainData = await getCachedWhoisInfo(domainName);
        
        // 记录特定域名的信息，用于调试
        if (domainName === 'yyas.top') {
          console.log('Current yyas.top status:', JSON.stringify(domainData));
        }
        
        // 如果不是自定义域名，且不在CF域名列表中，则删除
        if (domainData && !domainData.isCustom) {
          const cfDomain = cfDomains.find(d => d.domain === domainName);
          if (!cfDomain) {
            console.log(`Removing domain not in CF: ${domainName}`);
            await KV_NAMESPACE.delete(key.name);
          }
        }
      }
      
      // 处理CF中的域名，确保它们在KV中
      for (const cfDomain of cfDomains) {
        const cachedRecord = await getCachedWhoisRecord(cfDomain.domain);
        const cachedInfo = cachedRecord ? cachedRecord.data : null;
        const baseInfo = { ...cfDomain, ...(cachedInfo || {}) };

        if (shouldRefreshWhoisCache(baseInfo, cachedRecord)) {
          try {
            const whoisInfo = await fetchWhoisInfo(cfDomain.domain);
            const mergedInfo = mergeWhoisInfoWithFallback(baseInfo, whoisInfo);
            await cacheWhoisInfo(cfDomain.domain, mergedInfo);
          } catch (error) {
            console.error(`Error fetching WHOIS for ${cfDomain.domain}:`, error);
            await cacheWhoisInfo(cfDomain.domain, {
              ...baseInfo,
              whoisError: error.message
            });
          }
        } else if (!cachedInfo) {
          await cacheWhoisInfo(cfDomain.domain, baseInfo);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Cloudflare域名同步完成',
        count: cfDomains.length,
        domains: domainNamesList  // 返回域名列表
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // 更新域名信息
      let domainInfo = await getCachedWhoisInfo(domain) || {};
      domainInfo = {
        ...domainInfo,
        registrar,
        registrationDate,
        expirationDate,
        ...(Object.prototype.hasOwnProperty.call(data, 'parentRegistrationDate') ? { parentRegistrationDate } : {}),
        ...(Object.prototype.hasOwnProperty.call(data, 'parentExpirationDate') ? { parentExpirationDate } : {}),
        ...(Object.prototype.hasOwnProperty.call(data, 'secondLevelRegistrationDate') ? { secondLevelRegistrationDate } : {}),
        ...(Object.prototype.hasOwnProperty.call(data, 'secondLevelExpirationDate') ? { secondLevelExpirationDate } : {})
      };
      await cacheWhoisInfo(domain, domainInfo);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in handleApiUpdate:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleWhoisRequest(domain) {
  console.log(`Handling WHOIS request for domain: ${domain}`);

  try {
    const lookupResult = await resolveBestWhoisResultForDomain(domain);

    return new Response(JSON.stringify({
      error: false,
      domain,
      lookupDomain: lookupResult.lookupDomain || domain,
      source: lookupResult.source || 'unknown',
      parsed: lookupResult.parsed || null,
      trace: lookupResult.trace || [],
      rawData: lookupResult.rawData || ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error fetching WHOIS data for ${domain}:`, error);
    return new Response(JSON.stringify({
      error: true,
      message: `Failed to fetch WHOIS data for ${domain}. Error: ${error.message}`,
      trace: error.trace || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchCloudflareDomainsInfo() {
  let allZones = [];
  let page = 1;
  let hasMorePages = true;
  
  // 使用分页获取所有域名
  while (hasMorePages) {
    console.log(`Fetching Cloudflare zones page ${page}...`);
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones?page=${page}&per_page=50`, {
      headers: {
        'Authorization': `Bearer ${CF_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domains from Cloudflare: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Cloudflare API request failed');
    }

    allZones = [...allZones, ...data.result];
    
    // 检查是否有更多页面
    if (data.result_info.total_pages > page) {
      page++;
    } else {
      hasMorePages = false;
    }
  }

  console.log(`Total zones fetched from Cloudflare: ${allZones.length}`);
  
  // 只返回Zone信息，不获取DNS记录
  return allZones.map(zone => ({
    domain: zone.name,
    registrationDate: new Date(zone.created_on).toISOString().split('T')[0],
    system: 'Cloudflare',
    zoneId: zone.id
  }));
}


async function fetchDomainInfo(domains, options = {}) {
  const { allowWhoisRefresh = false } = options;
  const result = [];
  
  // 获取所有域名信息，包括自定义域名
  const allDomainKeys = await KV_NAMESPACE.list({ prefix: 'whois_' });
  const allDomains = await Promise.all(allDomainKeys.keys.map(async (key) => {
    const value = await KV_NAMESPACE.get(key.name);
    if (value) {
      try {
        const parsedValue = JSON.parse(value);
        return extractCachedWhoisData(parsedValue);
      } catch (error) {
        console.error(`Error parsing data for ${key.name}:`, error);
        return null;
      }
    }
    return null;
  }));

  // 过滤掉无效的域名数据
  const validAllDomains = allDomains.filter(d => d && d.isCustom);

  // 合并 Cloudflare 域名和自定义域名
  const mergedDomains = [...domains, ...validAllDomains];
  
  for (const domain of mergedDomains) {
    if (!domain) continue; // 跳过无效的域名数据

    let domainInfo = { ...domain };

    const domainName = domain.domain || domain;
    const cachedRecord = await getCachedWhoisRecord(domainName);
    const cachedInfo = cachedRecord ? cachedRecord.data : null;
    if (cachedInfo) {
      domainInfo = { ...domainInfo, ...cachedInfo };
    }

    if (allowWhoisRefresh && shouldRefreshWhoisCache(domainInfo, cachedRecord)) {
      try {
        const whoisInfo = await fetchWhoisInfo(domainInfo.domain);
        domainInfo = mergeWhoisInfoWithFallback(domainInfo, whoisInfo);
        await cacheWhoisInfo(domainInfo.domain, domainInfo);
      } catch (error) {
        console.error(`Error fetching WHOIS info for ${domainInfo.domain}:`, error);
        domainInfo.whoisError = error.message;
        await cacheWhoisInfo(domainInfo.domain, domainInfo);
      }
    }

    result.push(domainInfo);
  }
  return result;
}

async function fetchWhoisInfo(domain) {
  try {
    console.log(`Fetching WHOIS data for: ${domain}`);
    const lookupResult = await resolveBestWhoisResultForDomain(domain);
    const parsed = lookupResult.parsed;

    if (!isWhoisInfoCompletelyUnknown(parsed)) {
      return {
        ...parsed,
        whoisLookupDomain: lookupResult.lookupDomain
      };
    }

    return {
      registrar: 'Unknown',
      registrationDate: 'Unknown',
      expirationDate: 'Unknown',
      whoisError: 'WHOIS raw data parsed but required fields were not found'
    };
  } catch (error) {
    console.error(`Error fetching WHOIS info for ${domain}:`, error);

    return {
      registrar: 'Unknown',
      registrationDate: 'Unknown',
      expirationDate: 'Unknown',
      whoisError: error.message
    };
  }
}

async function fetchWhoisRawData(domain) {
  const lookupResult = await resolveBestWhoisResultForDomain(domain);
  return lookupResult.rawData;
}

async function resolveBestWhoisResultForDomain(domain) {
  const candidates = getWhoisLookupCandidates(domain);
  let bestResult = null;
  const errors = [];
  const aggregateTrace = [];

  for (const candidateDomain of candidates) {
    try {
      const candidateResult = await resolveBestWhoisResult(candidateDomain);
      const scoredCandidate = {
        ...candidateResult,
        lookupDomain: candidateDomain
      };
      aggregateTrace.push(...(candidateResult.trace || []).map((entry) => ({
        ...entry,
        lookupDomain: entry.lookupDomain || candidateDomain
      })));

      if (!bestResult || scoredCandidate.score > bestResult.score || (scoredCandidate.score === bestResult.score && String(scoredCandidate.rawData).length > String(bestResult.rawData).length)) {
        bestResult = scoredCandidate;
      }

      if (hasCompleteWhoisData(scoredCandidate.parsed)) {
        return {
          ...scoredCandidate,
          trace: aggregateTrace
        };
      }
    } catch (error) {
      errors.push(`${candidateDomain}: ${error.message}`);
      if (Array.isArray(error.trace) && error.trace.length) {
        aggregateTrace.push(...error.trace.map((entry) => ({
          ...entry,
          lookupDomain: entry.lookupDomain || candidateDomain
        })));
      }
      console.error(`WHOIS candidate lookup failed for ${candidateDomain}:`, error);
    }
  }

  if (bestResult) {
    return {
      ...bestResult,
      trace: aggregateTrace
    };
  }

  const lookupError = new Error(`WHOIS query failed (${errors.join(' | ')})`);
  lookupError.trace = aggregateTrace;
  throw lookupError;
}

function getWhoisLookupCandidates(domain) {
  const labels = String(domain || '').trim().toLowerCase().split('.').filter(Boolean);
  if (labels.length < 2) {
    return [domain];
  }

  const candidates = [];
  for (let i = 0; i <= labels.length - 2; i++) {
    candidates.push(labels.slice(i).join('.'));
  }

  if (labels.length > 2 && shouldPreferApiHz(labels[labels.length - 1])) {
    candidates.reverse();
  }

  return [...new Set(candidates)];
}

async function resolveBestWhoisResult(domain) {
  const cachedMemo = WHOIS_LOOKUP_MEMO.get(domain);
  if (cachedMemo && (Date.now() - cachedMemo.timestamp) < WHOIS_LOOKUP_MEMO_TTL_MS) {
    return cachedMemo.result;
  }

  const result = await performWhoisLookup(domain);
  WHOIS_LOOKUP_MEMO.set(domain, {
    timestamp: Date.now(),
    result
  });
  return result;
}

async function performWhoisLookup(domain) {
  const tld = domain.split('.').pop().toLowerCase();
  const preferOneFourLookup = shouldPreferOneFourLookup(tld);
  const preferProxy = shouldPreferWhoisProxy(tld);
  const preferApiHz = shouldPreferApiHz(tld);
  const attempts = [];

  if (preferApiHz) {
    attempts.push({ name: 'apihz-raw', fetcher: fetchWhoisRawDataViaApiHzRaw });
    attempts.push({ name: 'apihz-formatted', fetcher: fetchWhoisDataViaApiHzFormatted });
  }

  if (preferOneFourLookup) {
    attempts.push({ name: 'onefour', fetcher: fetchWhoisRawDataViaOneFourLookup });
  }

  if (preferProxy) {
    attempts.push({ name: 'proxy', fetcher: fetchWhoisRawDataViaProxy });
  }

  attempts.push(
    { name: 'direct', fetcher: fetchWhoisRawDataDirect },
    { name: 'authoritative-rdap', fetcher: fetchWhoisRawDataViaAuthoritativeRdap },
    { name: 'rdap-org', fetcher: fetchWhoisRawDataViaRdapOrg }
  );

  if (tld === 'xyz') {
    attempts.push({ name: 'rdap-xyz', fetcher: fetchWhoisRawDataViaXyzRdap });
    attempts.push({ name: 'rdap-aliyun', fetcher: fetchWhoisRawDataViaAliyunRdap });
  }

  if (hasApiHzCredentials() && !preferApiHz) {
    attempts.push({ name: 'apihz-formatted', fetcher: fetchWhoisDataViaApiHzFormatted });
    attempts.push({ name: 'apihz-raw', fetcher: fetchWhoisRawDataViaApiHzRaw });
  }

  if (hasTencentCloudCredentials()) {
    attempts.push({ name: 'tencentcloud-dnspod', fetcher: fetchWhoisRawDataViaTencentCloudDnsPod });
  }

  if (ENABLE_WHOIS_PROXY_FALLBACK && WHOIS_PROXY_URL && !preferProxy) {
    attempts.push({ name: 'proxy', fetcher: fetchWhoisRawDataViaProxy });
  }

  const errors = [];
  let bestResult = null;
  const trace = [];

  for (const attempt of attempts) {
    try {
      const attemptPayload = await attempt.fetcher(domain);
      const normalizedPayload = normalizeWhoisLookupPayload(attemptPayload, domain);
      const rawData = normalizedPayload.rawData || '';
      const parsed = sanitizeWhoisInfo(parseWhoisResult(normalizedPayload));
      const score = getWhoisDataScore(parsed);
      const candidate = {
        source: attempt.name,
        rawData,
        parsed,
        score
      };
      const traceEntry = {
        lookupDomain: domain,
        source: attempt.name,
        status: hasCompleteWhoisData(parsed) ? 'success' : 'incomplete',
        message: hasCompleteWhoisData(parsed) ? '查询成功' : '返回了结果，但缺少必要字段',
        score
      };
      trace.push(traceEntry);

      if (!bestResult || score > bestResult.score || (score === bestResult.score && String(rawData).length > String(bestResult.rawData).length)) {
        bestResult = candidate;
      }

      if (hasCompleteWhoisData(parsed)) {
        return {
          ...candidate,
          trace: [...trace]
        };
      }

      errors.push(`${attempt.name}: parsed but required fields were not found`);
    } catch (error) {
      errors.push(`${attempt.name}: ${error.message}`);
      trace.push({
        lookupDomain: domain,
        source: attempt.name,
        status: 'failed',
        message: error.message || '查询失败'
      });
      console.error(`${attempt.name} WHOIS failed for ${domain}:`, error);
    }
  }

  if (bestResult) {
    return {
      ...bestResult,
      trace
    };
  }

  const lookupError = new Error(`WHOIS query failed (${errors.join(' | ')})`);
  lookupError.trace = trace;
  throw lookupError;
}

function shouldPreferWhoisProxy(tld) {
  return Boolean(
    WHOIS_PROXY_URL &&
    WHOIS_PROXY_PREFERRED_TLDS &&
    WHOIS_PROXY_PREFERRED_TLDS.has(String(tld || '').toLowerCase())
  );
}

function hasApiHzCredentials() {
  return Boolean(APIHZ_USER_ID && APIHZ_KEY);
}

function hasTencentCloudCredentials() {
  return Boolean(TENCENTCLOUD_SECRET_ID && TENCENTCLOUD_SECRET_KEY);
}

function shouldPreferApiHz(tld) {
  return Boolean(
    hasApiHzCredentials() &&
    APIHZ_PREFERRED_TLDS &&
    APIHZ_PREFERRED_TLDS.has(String(tld || '').toLowerCase())
  );
}

function shouldPreferOneFourLookup(tld) {
  return Boolean(
    ONEFOUR_LOOKUP_URL &&
    ONEFOUR_LOOKUP_PREFERRED_TLDS &&
    ONEFOUR_LOOKUP_PREFERRED_TLDS.has(String(tld || '').toLowerCase())
  );
}

function normalizeWhoisLookupPayload(payload, domain) {
  if (typeof payload === 'string') {
    return { rawData: payload };
  }

  if (!payload || typeof payload !== 'object') {
    return { rawData: String(payload || '') };
  }

  const nestedData = payload.data && typeof payload.data === 'object'
    ? payload.data
    : null;
  const nestedResult = payload.result && typeof payload.result === 'object'
    ? payload.result
    : null;
  const structuredData = nestedData?.result && typeof nestedData.result === 'object'
    ? nestedData.result
    : (nestedResult || nestedData);

  const normalizedPayload = {
    registrar:
      normalizeWhoisValue(payload.registrar) ||
      normalizeWhoisValue(payload.registrarName) ||
      normalizeWhoisValue(structuredData?.registrar) ||
      normalizeWhoisValue(structuredData?.registrantOrganization),
    registrationDate:
      normalizeWhoisValue(payload.registrationDate) ||
      normalizeWhoisValue(payload.creationDate) ||
      normalizeWhoisValue(payload.createdDate) ||
      normalizeWhoisValue(payload.createdOn) ||
      normalizeWhoisValue(structuredData?.registrationDate) ||
      normalizeWhoisValue(structuredData?.creationDate) ||
      normalizeWhoisValue(structuredData?.createdDate),
    expirationDate:
      normalizeWhoisValue(payload.expirationDate) ||
      normalizeWhoisValue(payload.expiresDate) ||
      normalizeWhoisValue(payload.registryExpiryDate) ||
      normalizeWhoisValue(structuredData?.expirationDate) ||
      normalizeWhoisValue(structuredData?.expiresDate),
    rawData:
      normalizeWhoisValue(payload.rawData) ||
      normalizeWhoisValue(payload.rawWhoisText) ||
      normalizeWhoisValue(payload.rawText) ||
      normalizeWhoisValue(payload.rawWhoisContent) ||
      normalizeWhoisValue(structuredData?.rawData) ||
      normalizeWhoisValue(structuredData?.rawWhoisText) ||
      normalizeWhoisValue(structuredData?.rawText) ||
      normalizeWhoisValue(structuredData?.rawWhoisContent),
    status: normalizeWhoisStatusArray(payload.status || structuredData?.status),
    nameServers: normalizeWhoisStringArray(
      payload.nameServers ||
      payload.nameservers ||
      structuredData?.nameServers ||
      structuredData?.nameservers
    )
  };

  if (!normalizedPayload.rawData) {
    normalizedPayload.rawData = synthesizeRawWhoisFromProxyPayload(domain, normalizedPayload);
  }

  return normalizedPayload;
}

function normalizeWhoisStringArray(value) {
  const items = Array.isArray(value) ? value : (value ? [value] : []);
  return items
    .map(item => normalizeWhoisValue(item))
    .filter(Boolean);
}

function normalizeWhoisStatusArray(value) {
  const items = Array.isArray(value) ? value : (value ? [value] : []);
  return items
    .map(item => {
      if (item && typeof item === 'object') {
        return normalizeWhoisValue(item.status) || normalizeWhoisValue(item.value);
      }
      return normalizeWhoisValue(item);
    })
    .filter(Boolean);
}

function getWhoisDataScore(data) {
  if (!data || typeof data !== 'object') return 0;

  let score = 0;
  if (data.registrar && data.registrar !== 'Unknown') score += 1;
  if (data.registrationDate && data.registrationDate !== 'Unknown') score += 1;
  if (data.expirationDate && data.expirationDate !== 'Unknown') score += 1;
  return score;
}

async function fetchWhoisRawDataDirect(domain) {
  const connect = getWhoisConnect();
  const tld = domain.split('.').pop().toLowerCase();
  const whoisServer = await resolveWhoisServer(connect, tld);

  if (!whoisServer) {
    throw new Error(`Unable to resolve WHOIS server for .${tld}`);
  }

  let rawData = await queryWhoisServer(connect, whoisServer, domain);
  rawData = rawData || '';
  let bestRawData = rawData;
  let bestScore = getWhoisDataScore(parseWhoisResult({ rawData }));

  const referralServer = parseWhoisFieldFromRaw(rawData, ['Whois Server']);
  if (referralServer && !sameWhoisServer(referralServer, whoisServer)) {
    const referredData = await queryWhoisServer(connect, referralServer, domain);
    if (referredData && referredData.trim()) {
      const referredScore = getWhoisDataScore(parseWhoisResult({ rawData: referredData }));
      if (referredScore >= bestScore) {
        bestRawData = referredData;
        bestScore = referredScore;
      }
    }
  }

  if (!bestRawData.trim()) {
    throw new Error(`WHOIS response is empty from ${whoisServer}`);
  }

  return bestRawData;
}

function getWhoisConnect() {
  if (typeof connect === 'function') {
    return connect;
  }
  if (typeof globalThis.connect === 'function') {
    return globalThis.connect;
  }
  throw new Error('TCP connect() API is unavailable in the current Worker runtime');
}

async function fetchWhoisRawDataViaTencentCloudDnsPod(domain) {
  if (!hasTencentCloudCredentials()) {
    throw new Error('Tencent Cloud credentials are not configured');
  }

  const payload = JSON.stringify({ Domain: domain });
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` +
    `host:${TENCENTCLOUD_DNSPOD_HOST}\n` +
    `x-tc-action:${TENCENTCLOUD_DNSPOD_ACTION.toLowerCase()}\n`;
  const hashedRequestPayload = await sha256Hex(payload);
  const canonicalRequest =
    `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
  const credentialScope = `${date}/${TENCENTCLOUD_DNSPOD_SERVICE}/tc3_request`;
  const stringToSign =
    `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const secretDate = await hmacSha256(`TC3${TENCENTCLOUD_SECRET_KEY}`, date);
  const secretService = await hmacSha256(secretDate, TENCENTCLOUD_DNSPOD_SERVICE);
  const secretSigning = await hmacSha256(secretService, 'tc3_request');
  const signature = bytesToHex(await hmacSha256(secretSigning, stringToSign));
  const authorization =
    `TC3-HMAC-SHA256 Credential=${TENCENTCLOUD_SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${TENCENTCLOUD_DNSPOD_HOST}`, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json; charset=utf-8',
      'Host': TENCENTCLOUD_DNSPOD_HOST,
      'X-TC-Action': TENCENTCLOUD_DNSPOD_ACTION,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': TENCENTCLOUD_DNSPOD_VERSION
    },
    body: payload
  });

  if (!response.ok) {
    throw new Error(`Tencent Cloud DNSPod responded with status ${response.status}`);
  }

  const result = await response.json();
  const responseData = result?.Response;
  if (!responseData || typeof responseData !== 'object') {
    throw new Error('Tencent Cloud DNSPod returned empty payload');
  }

  if (responseData.Error) {
    throw new Error(
      `${responseData.Error.Code || 'TencentCloudError'}: ${responseData.Error.Message || 'unknown error'}`
    );
  }

  const info = responseData.Info && typeof responseData.Info === 'object'
    ? responseData.Info
    : responseData;
  const domainWhois = normalizeWhoisValue(responseData.DomainWhois);
  const rawEntries = Array.isArray(info.Raw)
    ? info.Raw
    : (Array.isArray(info.raw) ? info.raw : []);
  const rawData = rawEntries
    .map(item => normalizeWhoisValue(item))
    .filter(Boolean)
    .join('\n');

  return {
    registrar:
      normalizeWhoisValue(info.Registrar) ||
      normalizeWhoisValue(info.RegistrarName),
    registrationDate:
      normalizeWhoisValue(info.CreationDate) ||
      normalizeWhoisValue(info.CreatedDate) ||
      normalizeWhoisValue(info.RegistrationDate),
    expirationDate:
      normalizeWhoisValue(info.ExpirationDate) ||
      normalizeWhoisValue(info.ExpiresDate) ||
      normalizeWhoisValue(info.RegistryExpiryDate),
    status: normalizeWhoisStatusArray(info.Status),
    nameServers: normalizeWhoisStringArray(info.NameServers),
    rawData: rawData || domainWhois || JSON.stringify(responseData)
  };
}

async function fetchWhoisRawDataViaXyzRdap(domain) {
  const response = await fetch(`https://rdap.centralnic.com/xyz/domain/${encodeURIComponent(domain)}`, {
    headers: {
      'Accept': 'application/rdap+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`XYZ RDAP responded with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('XYZ RDAP returned empty payload');
  }

  return JSON.stringify(payload);
}

async function fetchWhoisRawDataViaRdapOrg(domain) {
  const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: {
      'Accept': 'application/rdap+json, application/json'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`RDAP.org responded with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('json')) {
    throw new Error(`RDAP.org returned non-JSON payload (${contentType})`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('RDAP.org returned empty payload');
  }

  return JSON.stringify(payload);
}

async function fetchWhoisRawDataViaAuthoritativeRdap(domain) {
  const tld = domain.split('.').pop().toLowerCase();
  const rdapEndpointMap = {
    in: 'https://rdap.nixiregistry.in/rdap/domain/',
    org: 'https://rdap.publicinterestregistry.org/rdap/domain/'
  };

  const baseUrl = rdapEndpointMap[tld];
  if (!baseUrl) {
    throw new Error(`No authoritative RDAP endpoint configured for .${tld}`);
  }

  const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
    headers: {
      'Accept': 'application/rdap+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Authoritative RDAP responded with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('Authoritative RDAP returned empty payload');
  }

  return JSON.stringify(payload);
}

async function fetchWhoisRawDataViaAliyunRdap(domain) {
  const response = await fetch(`https://whois.aliyun.com/rdap/domain/${encodeURIComponent(domain)}`, {
    headers: {
      'Accept': 'application/rdap+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Aliyun RDAP responded with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('Aliyun RDAP returned empty payload');
  }

  return JSON.stringify(payload);
}

async function fetchWhoisDataViaApiHzFormatted(domain) {
  if (!hasApiHzCredentials()) {
    throw new Error('APIHZ credentials are not configured');
  }

  if (!isTopLevelDomain(domain)) {
    throw new Error('APIHZ formatted endpoint only supports top-level domains');
  }

  const response = await fetch(buildApiHzFormattedUrl(domain), {
    headers: {
      'Accept': 'application/json, text/plain;q=0.9, */*;q=0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`APIHZ formatted endpoint responded with status ${response.status}`);
  }

  const payload = parseApiHzResponseText(await response.text());
  if (!payload || typeof payload !== 'object') {
    throw new Error('APIHZ formatted endpoint returned empty payload');
  }

  if (Number(payload.code) !== 200) {
    throw new Error(payload.msg || 'APIHZ formatted endpoint returned error');
  }

  return {
    registrar: normalizeWhoisValue(payload.zcname),
    registrationDate: normalizeWhoisValue(payload.addtime),
    expirationDate: normalizeWhoisValue(payload.endtime),
    status: normalizeWhoisStatusArray(payload.status),
    nameServers: normalizeWhoisStringArray([payload.ns1, payload.ns2, payload.ns3, payload.ns4, payload.ns5, payload.ns6, payload.ns7])
  };
}

async function fetchWhoisRawDataViaApiHzRaw(domain) {
  if (!hasApiHzCredentials()) {
    throw new Error('APIHZ credentials are not configured');
  }

  const response = await fetch(buildApiHzRawUrl(domain), {
    headers: {
      'Accept': 'application/json, text/plain;q=0.9, */*;q=0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`APIHZ raw endpoint responded with status ${response.status}`);
  }

  const payload = parseApiHzResponseText(await response.text());
  if (!payload || typeof payload !== 'object') {
    throw new Error('APIHZ raw endpoint returned empty payload');
  }

  if (Number(payload.code) !== 200) {
    throw new Error(payload.msg || 'APIHZ raw endpoint returned error');
  }

  const rawData = decodeApiHzWhoisText(payload.whois);
  if (!rawData) {
    throw new Error('APIHZ raw endpoint did not return WHOIS text');
  }

  if (/invalid request/i.test(rawData)) {
    throw new Error('APIHZ raw endpoint rejected this lookup');
  }

  return {
    rawData
  };
}

async function fetchWhoisRawDataViaOneFourLookup(domain) {
  if (!ONEFOUR_LOOKUP_URL) {
    throw new Error('OneFour lookup is not configured');
  }

  const response = await fetch(buildOneFourLookupUrl(domain), {
    headers: {
      'Accept': 'application/json, text/plain;q=0.9, */*;q=0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`OneFour lookup responded with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('OneFour lookup returned empty payload');
  }

  if (payload.status === false) {
    throw new Error(payload.message || 'OneFour lookup returned error');
  }

  const normalizedPayload = normalizeWhoisLookupPayload(payload, domain);
  const hasStructuredFields =
    Boolean(normalizedPayload.registrar) ||
    Boolean(normalizedPayload.registrationDate) ||
    Boolean(normalizedPayload.expirationDate) ||
    normalizedPayload.nameServers.length > 0 ||
    normalizedPayload.status.length > 0;

  if (String(normalizedPayload.rawData || '').trim() || hasStructuredFields) {
    return normalizedPayload;
  }

  throw new Error('OneFour lookup did not return parsable WHOIS data');
}

function decodeApiHzWhoisText(value) {
  return String(value || '')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function parseApiHzResponseText(responseText) {
  const text = String(responseText || '').trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const codeMatch = text.match(/"code"\s*:\s*(\d+)/);
    const domainMatch = text.match(/"domain"\s*:\s*"([^"]*)"/);
    const msgMatch = text.match(/"msg"\s*:\s*"([^"]*)"/);
    const whoisMarker = '"whois":"';
    const whoisStart = text.indexOf(whoisMarker);
    let whois = null;

    if (whoisStart !== -1) {
      const endBraceIndex = text.lastIndexOf('}');
      const whoisEnd = endBraceIndex > whoisStart ? text.lastIndexOf('"', endBraceIndex - 1) : -1;
      if (whoisEnd > whoisStart) {
        whois = text.slice(whoisStart + whoisMarker.length, whoisEnd);
      }
    }

    return {
      code: codeMatch ? Number(codeMatch[1]) : NaN,
      domain: domainMatch ? domainMatch[1] : '',
      msg: msgMatch ? msgMatch[1] : '',
      whois
    };
  }
}

function synthesizeRawWhoisFromProxyPayload(domain, payload) {
  const lines = [];

  if (domain) lines.push(`Domain Name: ${domain}`);
  if (payload.registrar) lines.push(`Registrar: ${payload.registrar}`);
  if (payload.registrationDate) lines.push(`Creation Date: ${payload.registrationDate}`);
  if (payload.expirationDate) lines.push(`Registry Expiry Date: ${payload.expirationDate}`);

  for (const nameServer of payload.nameServers || []) {
    lines.push(`Name Server: ${nameServer}`);
  }

  for (const status of payload.status || []) {
    lines.push(`Domain Status: ${status}`);
  }

  return lines.join('\n');
}

async function fetchWhoisRawDataViaProxy(domain) {
  if (!WHOIS_PROXY_URL) {
    throw new Error('WHOIS proxy is not configured');
  }

  const response = await fetch(buildWhoisProxyLookupUrl(domain), {
    headers: {
      'Accept': 'application/json, text/plain;q=0.9, */*;q=0.1'
    }
  });
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`WHOIS proxy responded with status ${response.status}`);
  }

  if (!responseText) {
    throw new Error('WHOIS proxy returned empty response');
  }

  let proxyData = null;
  try {
    proxyData = JSON.parse(responseText);
  } catch (error) {
    proxyData = null;
  }

  if (proxyData && typeof proxyData === 'object') {
    if (proxyData.error || proxyData.success === false) {
      throw new Error(proxyData.message || 'WHOIS proxy returned error');
    }

    const normalizedPayload = normalizeWhoisLookupPayload(proxyData, domain);
    const hasStructuredFields =
      Boolean(normalizedPayload.registrar) ||
      Boolean(normalizedPayload.registrationDate) ||
      Boolean(normalizedPayload.expirationDate) ||
      normalizedPayload.nameServers.length > 0 ||
      normalizedPayload.status.length > 0;

    if (String(normalizedPayload.rawData || '').trim() || hasStructuredFields) {
      return normalizedPayload;
    }
  }

  if (contentType.includes('text/plain') || responseText.includes('\n')) {
    return responseText;
  }

  throw new Error(`WHOIS proxy returned unsupported payload (${contentType})`);
}

function buildWhoisProxyLookupUrl(domain) {
  const normalizedBaseUrl = WHOIS_PROXY_URL.endsWith('/')
    ? WHOIS_PROXY_URL
    : `${WHOIS_PROXY_URL}/`;
  const url = new URL(`whois/${encodeURIComponent(domain)}`, normalizedBaseUrl);
  url.searchParams.set('raw', '1');
  return url.toString();
}

function buildApiHzFormattedUrl(domain) {
  const url = new URL(APIHZ_FORMATTED_URL);
  url.searchParams.set('id', APIHZ_USER_ID);
  url.searchParams.set('key', APIHZ_KEY);
  url.searchParams.set('domain', domain);
  return url.toString();
}

function buildApiHzRawUrl(domain) {
  const url = new URL(APIHZ_RAW_URL);
  url.searchParams.set('id', APIHZ_USER_ID);
  url.searchParams.set('key', APIHZ_KEY);
  url.searchParams.set('domain', domain);
  url.searchParams.set('type', '1');
  return url.toString();
}

function buildOneFourLookupUrl(domain) {
  const url = new URL(ONEFOUR_LOOKUP_URL);
  url.searchParams.set('query', domain);
  return url.toString();
}

async function sha256Hex(value) {
  const bytes = typeof value === 'string' ? TEXT_ENCODER.encode(value) : new Uint8Array(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(digest);
}

async function hmacSha256(key, message) {
  const keyBytes = typeof key === 'string' ? TEXT_ENCODER.encode(key) : new Uint8Array(key);
  const messageBytes = typeof message === 'string' ? TEXT_ENCODER.encode(message) : new Uint8Array(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, messageBytes));
}

function bytesToHex(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function resolveWhoisServer(connect, tld) {
  const staticMap = {
    art: 'whois.nic.art',
    blog: 'whois.nic.blog',
    com: 'whois.verisign-grs.com',
    cool: 'whois.nic.cool',
    my: 'whois.mynic.my',
    net: 'whois.verisign-grs.com',
    org: 'whois.pir.org',
    top: 'whois.nic.top',
    xyz: 'whois.nic.xyz',
    yoga: 'whois.nic.yoga'
  };

  if (staticMap[tld]) {
    return staticMap[tld];
  }

  const ianaData = await queryWhoisServer(connect, 'whois.iana.org', tld);
  const discovered = parseWhoisFieldFromRaw(ianaData, ['whois']);
  return discovered || null;
}

async function queryWhoisServer(connect, hostname, query) {
  const socket = connect({
    hostname,
    port: WHOIS_PORT
  }, {
    secureTransport: 'off'
  });

  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();

  try {
    await withTimeout(
      writer.write(encoder.encode(`${query}\r\n`)),
      WHOIS_QUERY_TIMEOUT_MS,
      `WHOIS write timeout (${hostname})`
    );
    await writer.close();

    const rawData = await withTimeout(
      readAllFromSocket(socket.readable),
      WHOIS_QUERY_TIMEOUT_MS,
      `WHOIS read timeout (${hostname})`
    );
    return rawData;
  } finally {
    try {
      writer.releaseLock();
    } catch (error) {
      // ignore writer release errors
    }
    try {
      await socket.close();
    } catch (error) {
      // ignore socket close errors
    }
  }
}

async function readAllFromSocket(readable) {
  const reader = readable.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || !value.byteLength) continue;

      total += value.byteLength;
      if (total > WHOIS_MAX_RESPONSE_BYTES) {
        throw new Error('WHOIS response too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (!chunks.length) return '';

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function sameWhoisServer(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function parseWhoisResult(whoisData) {
  const source = typeof whoisData === 'string'
    ? { rawData: whoisData }
    : (whoisData && typeof whoisData === 'object' ? whoisData : {});

  const rawText =
    normalizeWhoisValue(source.rawData) ||
    normalizeWhoisValue(source.rawWhoisText) ||
    normalizeWhoisValue(source.raw) ||
    '';

  const structuredRaw = parseStructuredWhoisPayload(rawText);
  const structuredParsed = structuredRaw ? parseStructuredWhoisResult(structuredRaw) : null;

  const registrarFromFields = getFirstWhoisValue(source, [
    'registrar',
    'registrarName',
    'sponsoringRegistrar',
    'registrar_name',
    'Registrar'
  ]);

  const registrationDateFromFields = getFirstWhoisValue(source, [
    'creationDate',
    'createdDate',
    'createdOn',
    'creation_date',
    'registeredOn',
    'registrationDate'
  ]);

  const expirationDateFromFields = getFirstWhoisValue(source, [
    'expirationDate',
    'registryExpiryDate',
    'registryExpirationDate',
    'RegistryExpiryDate',
    'RegistryExpirationDate',
    'expiryDate',
    'expiresDate',
    'expireDate',
    'expiration_date',
    'paidTill'
  ]);

  const registrarFromRaw = parseWhoisFieldFromRaw(rawText, [
    'Registrar',
    'Sponsoring Registrar',
    'Registrar Name'
  ]);

  const registrationDateFromRaw = parseWhoisFieldFromRaw(rawText, [
    'Creation Date',
    'Created Date',
    'Created On',
    'Registered On',
    'created'
  ]);

  const expirationDateFromRaw = parseWhoisFieldFromRaw(rawText, [
    'Registry Expiry Date',
    'Registrar Registration Expiration Date',
    'Expiration Date',
    'Expiry Date',
    'Expire Date',
    'Expires On',
    'Paid-till',
    'expires'
  ]);

  return {
    registrar: structuredParsed?.registrar || registrarFromFields || registrarFromRaw || 'Unknown',
    registrationDate: formatDate(structuredParsed?.registrationDate || registrationDateFromFields || registrationDateFromRaw) || 'Unknown',
    expirationDate: formatDate(structuredParsed?.expirationDate || expirationDateFromFields || expirationDateFromRaw) || 'Unknown'
  };
}

function parseStructuredWhoisPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  const trimmed = rawText.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return null;
  }
}

function parseStructuredWhoisResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const registryData = payload?.registryData && typeof payload.registryData === 'object'
    ? payload.registryData
    : null;

  const registrationDate =
    extractWhoisEventDate(payload, ['registration', 'created', 'creation']) ||
    getFirstWhoisValue(payload, ['createdDateNormalized', 'createdDate', 'creationDate', 'createdOn', 'registeredDate']) ||
    getFirstWhoisValue(registryData, ['createdDateNormalized', 'createdDate', 'creationDate', 'createdOn', 'registeredDate']);

  const expirationDate =
    extractWhoisEventDate(payload, ['expiration', 'expiry', 'expires', 'registrar expiration']) ||
    getFirstWhoisValue(payload, ['expiresDateNormalized', 'expiresDate', 'expirationDate', 'registryExpiryDate', 'registryExpirationDate']) ||
    getFirstWhoisValue(registryData, ['expiresDateNormalized', 'expiresDate', 'expirationDate', 'registryExpiryDate', 'registryExpirationDate']);

  return {
    registrar: extractRegistrarFromStructuredWhois(payload) || extractRegistrarFromStructuredWhois(registryData),
    registrationDate,
    expirationDate
  };
}

function extractRegistrarFromStructuredWhois(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const directRegistrar = getFirstWhoisValue(payload, [
    'registrar',
    'registrarName',
    'sponsoringRegistrar',
    'name'
  ]);
  if (directRegistrar) {
    return directRegistrar;
  }

  const entities = Array.isArray(payload.entities) ? payload.entities : [];
  for (const entity of entities) {
    const roles = Array.isArray(entity?.roles) ? entity.roles.map(role => String(role).toLowerCase()) : [];
    if (!roles.includes('registrar')) {
      continue;
    }

    const vcardName = extractNameFromVcardArray(entity.vcardArray);
    if (vcardName) {
      return vcardName;
    }

    const entityName = getFirstWhoisValue(entity, ['fn', 'handle', 'name']);
    if (entityName) {
      return entityName;
    }
  }

  return null;
}

function extractWhoisEventDate(payload, expectedActions) {
  const events = Array.isArray(payload.events) ? payload.events : [];
  const normalizedExpected = expectedActions.map(action => normalizeWhoisEventAction(action));

  for (const event of events) {
    const action = normalizeWhoisEventAction(event?.eventAction);
    if (!action || !normalizedExpected.includes(action)) {
      continue;
    }

    const eventDate = normalizeWhoisValue(event?.eventDate);
    if (eventDate) {
      return eventDate;
    }
  }

  return null;
}

function normalizeWhoisEventAction(action) {
  return String(action || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function extractNameFromVcardArray(vcardArray) {
  if (!Array.isArray(vcardArray) || !Array.isArray(vcardArray[1])) {
    return null;
  }

  for (const entry of vcardArray[1]) {
    if (!Array.isArray(entry) || entry.length < 4) {
      continue;
    }

    if (entry[0] === 'fn' || entry[0] === 'org') {
      const value = normalizeWhoisValue(entry[3]);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function getFirstWhoisValue(data, keys) {
  if (!data || typeof data !== 'object') return null;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const normalized = normalizeWhoisValue(data[key]);
      if (normalized) return normalized;
    }
  }

  return null;
}

function normalizeWhoisValue(value) {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalizedItem = normalizeWhoisValue(item);
      if (normalizedItem) return normalizedItem;
    }
    return null;
  }

  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      return normalizeWhoisValue(value.value);
    }
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function parseWhoisFieldFromRaw(rawData, fieldNames) {
  if (!rawData || typeof rawData !== 'string' || !fieldNames || !fieldNames.length) {
    return null;
  }

  const escapedNames = fieldNames.map(escapeRegExp);
  const pattern = new RegExp(`(?:^|\\n)\\s*(?:${escapedNames.join('|')})\\s*:\\s*(.+)$`, 'im');
  const match = rawData.match(pattern);

  return match && match[1] ? match[1].trim() : null;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toISOString().split('T')[0];
}

async function getCachedWhoisRecord(domain) {
  const cacheKey = `whois_${domain}`;
  const cachedData = await KV_NAMESPACE.get(cacheKey);
  if (!cachedData) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(cachedData);
    const record = normalizeWhoisCacheRecord(parsedValue);

    if (!record || !record.data || typeof record.data !== 'object') {
      await KV_NAMESPACE.delete(cacheKey);
      return null;
    }

    record.data = sanitizeWhoisInfo(record.data);
    return record;
  } catch (error) {
    console.error(`Error parsing cached data for ${domain}:`, error);
    await KV_NAMESPACE.delete(cacheKey);
    return null;
  }
}

async function getCachedWhoisInfo(domain) {
  const record = await getCachedWhoisRecord(domain);
  return record ? record.data : null;
}

function extractCachedWhoisData(parsedCacheValue) {
  const record = normalizeWhoisCacheRecord(parsedCacheValue);
  if (!record || !record.data || typeof record.data !== 'object') {
    return null;
  }
  return record.data;
}

function normalizeWhoisCacheRecord(parsedCacheValue) {
  if (!parsedCacheValue || typeof parsedCacheValue !== 'object') {
    return null;
  }

  if (parsedCacheValue.data && typeof parsedCacheValue.data === 'object') {
    return {
      data: parsedCacheValue.data,
      timestamp: typeof parsedCacheValue.timestamp === 'number' ? parsedCacheValue.timestamp : null,
      version: typeof parsedCacheValue.version === 'number' ? parsedCacheValue.version : null
    };
  }

  // Backward compatibility for legacy cache shape: direct object without { data, timestamp, version }.
  return {
    data: parsedCacheValue,
    timestamp: null,
    version: null
  };
}
async function cacheWhoisInfo(domain, whoisInfo) {
  const cacheKey = `whois_${domain}`;
  const sanitizedInfo = sanitizeWhoisInfo(whoisInfo);
  await KV_NAMESPACE.put(cacheKey, JSON.stringify({
    data: sanitizedInfo,
    timestamp: Date.now(),
    version: WHOIS_CACHE_SCHEMA_VERSION
  }));
}

function isWhoisInfoCompletelyUnknown(data) {
  if (!data || typeof data !== 'object') return false;

  const registrarUnknown = !data.registrar || data.registrar === 'Unknown';
  const registrationUnknown = !data.registrationDate || data.registrationDate === 'Unknown';
  const expirationUnknown = !data.expirationDate || data.expirationDate === 'Unknown';

  return registrarUnknown && registrationUnknown && expirationUnknown;
}

function hasCompleteWhoisData(data) {
  if (!data || typeof data !== 'object') return false;
  return (
    data.registrar && data.registrar !== 'Unknown' &&
    data.registrationDate && data.registrationDate !== 'Unknown' &&
    data.expirationDate && data.expirationDate !== 'Unknown'
  );
}

function sanitizeWhoisInfo(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const isTopLevel = isTopLevelDomain(sanitized.domain);

  if (!isTopLevel) {
    if (!sanitized.parentRegistrationDate && sanitized.registrationDate) {
      sanitized.parentRegistrationDate = sanitized.registrationDate;
    }
    if (!sanitized.parentExpirationDate && sanitized.expirationDate) {
      sanitized.parentExpirationDate = sanitized.expirationDate;
    }
    if (sanitized.parentRegistrationDate) {
      sanitized.registrationDate = sanitized.parentRegistrationDate;
    }
    if (sanitized.parentExpirationDate) {
      sanitized.expirationDate = sanitized.parentExpirationDate;
    }
  }

  if (sanitized.isCustom || !isTopLevelDomain(sanitized.domain)) {
    delete sanitized.whoisError;
    return sanitized;
  }

  if (hasCompleteWhoisData(sanitized)) {
    delete sanitized.whoisError;
  }

  return sanitized;
}

function shouldRefreshWhoisCache(domainInfo, cachedRecord) {
  if (!domainInfo || typeof domainInfo !== 'object') return false;
  if (!domainInfo.domain) return false;
  if (domainInfo.isCustom) return false;
  if (!cachedRecord || !cachedRecord.data) return true;

  const cachedData = cachedRecord.data;
  const hasTimestamp = typeof cachedRecord.timestamp === 'number';
  const ageMs = hasTimestamp ? Date.now() - cachedRecord.timestamp : null;
  const isCurrentSchema = cachedRecord.version === WHOIS_CACHE_SCHEMA_VERSION;

  if (!isCurrentSchema) {
    return true;
  }

  if (!hasCompleteWhoisData(cachedData)) {
    if (!cachedData.whoisError) {
      return true;
    }
    if (!hasTimestamp) {
      return true;
    }
    return ageMs > WHOIS_ERROR_RETRY_MS;
  }

  // Keep legacy complete records without timestamps to prevent accidental data loss.
  if (!hasTimestamp) {
    return false;
  }

  return ageMs > WHOIS_CACHE_TTL_MS;
}

function mergeWhoisInfoWithFallback(baseInfo, whoisInfo) {
  const mergedInfo = { ...baseInfo };
  if (!whoisInfo || typeof whoisInfo !== 'object') {
    return sanitizeWhoisInfo(mergedInfo);
  }

  const isTopLevel = isTopLevelDomain(mergedInfo.domain || whoisInfo.domain);

  if (whoisInfo.registrar && whoisInfo.registrar !== 'Unknown') {
    mergedInfo.registrar = whoisInfo.registrar;
  }
  if (whoisInfo.registrationDate && whoisInfo.registrationDate !== 'Unknown') {
    mergedInfo.registrationDate = whoisInfo.registrationDate;
    if (!isTopLevel) {
      mergedInfo.parentRegistrationDate = whoisInfo.registrationDate;
    }
  }
  if (whoisInfo.expirationDate && whoisInfo.expirationDate !== 'Unknown') {
    mergedInfo.expirationDate = whoisInfo.expirationDate;
    if (!isTopLevel) {
      mergedInfo.parentExpirationDate = whoisInfo.expirationDate;
    }
  }
  if (whoisInfo.whoisLookupDomain) {
    mergedInfo.whoisLookupDomain = whoisInfo.whoisLookupDomain;
  }

  if (whoisInfo.whoisError) {
    mergedInfo.whoisError = whoisInfo.whoisError;
  } else {
    delete mergedInfo.whoisError;
  }

  return sanitizeWhoisInfo(mergedInfo);
}

function isTopLevelDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  return domain.split('.').length === 2;
}

function getDisplayValue(value, fallback = 'Unknown') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function getInputValue(value) {
  const normalized = String(value || '').trim();
  return normalized === 'Unknown' ? '' : normalized;
}

function normalizeCompactDateDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

function toCompactDateString(value) {
  const normalized = getInputValue(value);
  if (!normalized) {
    return '';
  }

  const digits = normalizeCompactDateDigits(normalized);
  if (digits.length === 8) {
    return digits;
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }

  return digits;
}

function toIsoDateString(value) {
  const normalized = getInputValue(value);
  if (!normalized) {
    return '';
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return normalized;
  }

  const digits = normalizeCompactDateDigits(normalized);
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSupportBanner() {
  const donateButton = DONATE_URL
    ? `<a class="support-btn donate-btn" href="${escapeHtml(DONATE_URL)}" target="_blank" rel="noopener noreferrer">请我喝杯奶茶</a>`
    : '';

  return `
    <div class="support-banner">
      <div class="support-copy">
        <strong>如果这个项目对你有帮助，欢迎点个 GitHub Star。</strong>
        <span>开源维护不易，觉得好用的话，也欢迎支持一杯奶茶。</span>
      </div>
      <div class="support-actions">
        <a class="support-btn github-btn" href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub 仓库</a>
        <a class="support-btn star-btn" href="${GITHUB_STARS_URL}" target="_blank" rel="noopener noreferrer">给个 Star</a>
        ${donateButton}
      </div>
    </div>
  `;
}

function getParentDomainName(domainInfo) {
  const domain = String(domainInfo?.domain || '').trim();
  const lookupDomain = String(domainInfo?.whoisLookupDomain || '').trim();
  if (lookupDomain && lookupDomain !== domain) {
    return lookupDomain;
  }

  const labels = domain.split('.').filter(Boolean);
  if (labels.length > 2) {
    return labels.slice(1).join('.');
  }

  return domain;
}

function calculateLifecycle(registrationDateText, expirationDateText) {
  const today = new Date();
  const registrationDate = new Date(registrationDateText);
  const expirationDate = new Date(expirationDateText);
  const hasValidRegistration = registrationDateText !== 'Unknown' && !isNaN(registrationDate.getTime());
  const hasValidExpiry = expirationDateText !== 'Unknown' && !isNaN(expirationDate.getTime());
  const daysRemaining = hasValidExpiry
    ? Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
    : NaN;
  const totalDays = hasValidRegistration && hasValidExpiry
    ? Math.ceil((expirationDate - registrationDate) / (1000 * 60 * 60 * 24))
    : NaN;

  let progressPercentage = 0;
  if (Number.isFinite(daysRemaining) && Number.isFinite(totalDays) && totalDays > 0) {
    progressPercentage = 100 - (daysRemaining / totalDays * 100);
  }

  return {
    daysRemaining,
    totalDays,
    progressPercentage: Math.max(0, Math.min(100, progressPercentage))
  };
}

function buildDomainPresentation(info) {
  const normalizedInfo = sanitizeWhoisInfo(info);
  const isNestedDomain = !isTopLevelDomain(normalizedInfo.domain);
  const parentRegistrationDate = getDisplayValue(
    isNestedDomain
      ? normalizedInfo.parentRegistrationDate || normalizedInfo.registrationDate
      : normalizedInfo.registrationDate
  );
  const parentExpirationDate = getDisplayValue(
    isNestedDomain
      ? normalizedInfo.parentExpirationDate || normalizedInfo.expirationDate
      : normalizedInfo.expirationDate
  );
  const secondLevelRegistrationDate = getDisplayValue(normalizedInfo.secondLevelRegistrationDate);
  const secondLevelExpirationDate = getDisplayValue(normalizedInfo.secondLevelExpirationDate);
  const effectiveRegistrationDate = isNestedDomain && secondLevelRegistrationDate !== 'Unknown'
    ? secondLevelRegistrationDate
    : parentRegistrationDate;
  const effectiveExpirationDate = isNestedDomain && secondLevelExpirationDate !== 'Unknown'
    ? secondLevelExpirationDate
    : parentExpirationDate;
  const lifecycle = calculateLifecycle(effectiveRegistrationDate, effectiveExpirationDate);

  return {
    ...normalizedInfo,
    isNestedDomain,
    parentDomainName: getParentDomainName(normalizedInfo),
    registrarText: getDisplayValue(normalizedInfo.registrar),
    parentRegistrationDateText: parentRegistrationDate,
    parentExpirationDateText: parentExpirationDate,
    secondLevelRegistrationDateText: secondLevelRegistrationDate,
    secondLevelExpirationDateText: secondLevelExpirationDate,
    effectiveRegistrationDateText: effectiveRegistrationDate,
    effectiveExpirationDateText: effectiveExpirationDate,
    effectiveSourceText: isNestedDomain && secondLevelExpirationDate !== 'Unknown' ? '二级域名' : (isNestedDomain ? '一级域名兜底' : '当前域名'),
    missingSecondLevelDates: isNestedDomain && (secondLevelRegistrationDate === 'Unknown' || secondLevelExpirationDate === 'Unknown'),
    ...lifecycle
  };
}
function generateLoginHTML(title, action, errorMessage = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${CUSTOM_TITLE}</title>
    <link rel="icon" href="/favicon.svg?v=${VERSION}" sizes="any" type="image/svg+xml">
    <link rel="shortcut icon" href="/favicon.ico?v=${VERSION}" type="image/svg+xml">
    <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      min-height: 100vh;
      padding: 24px;
      background: linear-gradient(180deg, #eef4ff 0%, #f6f8fb 100%);
      color: #1f2937;
      box-sizing: border-box;
    }
    .login-shell {
      max-width: 1080px;
      margin: 0 auto;
      padding-bottom: 60px;
    }
    .login-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      color: #475569;
      font-size: 14px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.82);
      border: 1px solid #dbe3ef;
      border-radius: 999px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }
    .support-banner {
      margin: 0 auto 20px;
      max-width: 780px;
      padding: 16px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.92);
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }
    .support-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #334155;
      font-size: 13px;
    }
    .support-copy span {
      color: #64748b;
    }
    .support-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .support-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 14px;
      border-radius: 999px;
      border: 1px solid #dbe3ef;
      background: #ffffff;
      color: #0f172a;
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;
    }
    .star-btn {
      background: #fef3c7;
      border-color: #facc15;
      color: #854d0e;
    }
    .donate-btn {
      background: #dcfce7;
      border-color: #86efac;
      color: #166534;
    }
    .login-card {
      max-width: 460px;
      margin: 72px auto 0;
      background: rgba(255,255,255,0.92);
      border: 1px solid #dbe3ef;
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      overflow: hidden;
    }
    .login-card-header {
      padding: 28px 28px 12px;
    }
    .login-card-header h1 {
      margin: 0;
      font-size: 30px;
    }
    .login-card-header p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 14px;
    }
    .login-form {
      padding: 16px 28px 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .login-form label {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 14px;
      color: #334155;
    }
    .login-form input[type="password"] {
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 15px;
      background: #fff;
      color: #0f172a;
    }
    .submit-btn {
      appearance: none;
      border: 1px solid #2563eb;
      background: #2563eb;
      color: #fff;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
    }
    .error-message {
      margin: 0;
      border-radius: 12px;
      padding: 12px 14px;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #be123c;
      font-size: 14px;
    }
    @media (max-width: 640px) {
      body {
        padding: 16px;
      }
      .login-card {
        margin-top: 28px;
      }
      .login-card-header,
      .login-form {
        padding-left: 18px;
        padding-right: 18px;
      }
      .login-card-header h1 {
        font-size: 26px;
      }
      .login-topbar {
        flex-direction: column;
        align-items: flex-start;
      }
      .support-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .support-actions {
        justify-content: flex-start;
      }
    }
    </style>
  </head>
  <body>
    <div class="login-shell">
      <div class="login-topbar">
        <div class="brand-pill">${CUSTOM_TITLE}</div>
        <div class="brand-pill">${title}</div>
      </div>
      ${renderSupportBanner()}
      <div class="login-card">
        <div class="login-card-header">
          <h1>${title}</h1>
          <p>输入密码后进入对应页面，整体界面风格已与主页面统一。</p>
        </div>
        <form class="login-form" method="POST" action="${action}">
          ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}
          <label>
            <span>密码</span>
            <input type="password" name="password" placeholder="请输入密码" required>
          </label>
          <input class="submit-btn" type="submit" value="登录">
        </form>
      </div>
    </div>
    ${footerHTML}
  </body>
  </html>
  `;
}

function generateHTMLLegacy(domains, isAdmin) {
  const categorizedDomains = categorizeDomains(domains);
  
  console.log("Categorized domains:", categorizedDomains);
  const generateTable = (domainList, isCFTopLevel) => {
    if (!domainList || !Array.isArray(domainList)) {
      console.error('Invalid domainList:', domainList);
      return '';
    }
    return domainList.map(info => {
      const normalizedInfo = sanitizeWhoisInfo(info);
      const hasCompleteInfo = hasCompleteWhoisData(normalizedInfo);
      const registrar = normalizedInfo.registrar || 'Unknown';
      const registrationDateText = normalizedInfo.registrationDate || 'Unknown';
      const expirationDateText = normalizedInfo.expirationDate || 'Unknown';
      info = normalizedInfo;
      const today = new Date();
      const expirationDate = new Date(expirationDateText);
      const registrationDate = new Date(registrationDateText);
      const hasValidExpiry = expirationDateText !== 'Unknown' && !isNaN(expirationDate.getTime());
      const hasValidRegistration = registrationDateText !== 'Unknown' && !isNaN(registrationDate.getTime());
      const daysRemaining = hasValidExpiry ? Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24)) : 'N/A';
      const totalDays = (hasValidRegistration && hasValidExpiry) ? Math.ceil((expirationDate - registrationDate) / (1000 * 60 * 60 * 24)) : 'N/A';
      const progressPercentage = isNaN(daysRemaining) || isNaN(totalDays) ? 0 : 100 - (daysRemaining / totalDays * 100);
      const whoisErrorMessage = (!hasCompleteInfo && normalizedInfo.whoisError)
        ? `<br><span style="color: red;">WHOIS错误: ${normalizedInfo.whoisError}</span><br><span style="color: blue;">建议：请检查域名状态或API配置</span>`
        : '';
  
      let operationButtons = '';
      if (isAdmin) {
        if (isCFTopLevel) {
          operationButtons = `
            <button onclick="editDomain('${info.domain}', this)">编辑</button>
            <button onclick="deleteDomain('${info.domain}')">删除</button>
            <button data-action="update-whois" data-domain="${info.domain}">更新WHOIS</button>
            <button data-action="query-whois" data-domain="${info.domain}">查询WHOIS</button>
            <button data-action="view-props" data-domain="${info.domain}">查看属性</button>
            ${info.isCustom ? `<button data-action="reset-custom" data-domain="${info.domain}">重置为非自定义</button>` : ''}
          `;
        } else {
          operationButtons = `
            <button onclick="editDomain('${info.domain}', this)">编辑</button>
            <button onclick="deleteDomain('${info.domain}')">删除</button>
            <button data-action="view-props" data-domain="${info.domain}">查看属性</button>
            ${info.isCustom ? `<button data-action="reset-custom" data-domain="${info.domain}">重置为非自定义</button>` : ''}
          `;
        }
      }
  
      return `
        <tr data-domain="${info.domain}">
          <td class="status-column"><span class="status-dot" style="background-color: ${getStatusColor(daysRemaining)};" title="${getStatusTitle(daysRemaining)}"></span></td>
          <td class="domain-column" title="${info.domain}">${info.domain}</td>
          <td class="system-column" title="${info.system}">${info.system}</td>
          <td class="registrar-column editable" title="${registrar}${whoisErrorMessage}">${registrar}${whoisErrorMessage}</td>
          <td class="date-column editable" title="${registrationDateText}">${registrationDateText}</td>
          <td class="date-column editable" title="${expirationDateText}">${expirationDateText}</td>
          <td class="days-column" title="${daysRemaining}">${daysRemaining}</td>
          <td class="progress-column">
            <div class="progress-bar">
              <div class="progress" style="width: ${progressPercentage}%;" title="${progressPercentage.toFixed(2)}%"></div>
            </div>
          </td>
          ${isAdmin ? `<td class="operation-column">${operationButtons}</td>` : ''}
        </tr>
      `;
    }).join('');
  };

  const cfTopLevelTable = generateTable(categorizedDomains.cfTopLevel, true);
  const cfSecondLevelAndCustomTable = generateTable(categorizedDomains.cfSecondLevelAndCustom, false);

  const adminLink = isAdmin 
    ? '<span>当前为后台管理页面</span> | <a href="/">返回前台</a>' 
    : '<a href="/admin">进入后台管理</a>';
    
  const adminTools = isAdmin ? `
    <div style="margin: 20px 0;">
      <button id="syncCloudflareBtn" class="btn btn-primary">同步Cloudflare域名</button>
      <span id="syncStatus" style="margin-left: 10px;"></span>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      margin: 0 auto;
      padding: 0 15px;
    }

    .container {
    padding-bottom: 60px; /* 根据页脚高度调整 */
    }

    footer {
      position: relative;
      left: 0;
      bottom: 0;
      width: 100%;
    }

    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      padding-bottom: 0;
      transition: padding-bottom 0.16s ease;
    }
    .table-wrapper:has(.sortable-header.menu-open) {
      padding-bottom: 156px;
    }
  
    h2.table-title {
      font-size: 1.5em;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ddd;
    }
  
    .table-separator {
      height: 2px;
      background-color: #eee;
      margin: 30px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      table-layout: auto;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .status-column { width: 30px; min-width: 30px; max-width: 50px; }
    .domain-column { min-width: 120px; max-width: 25%; }
    .system-column, .registrar-column { min-width: 80px; max-width: 15%; }
    .date-column { min-width: 90px; max-width: 12%; }
    .days-column { min-width: 60px; max-width: 10%; }
    .progress-column { min-width: 100px; max-width: 20%; }
    .operation-column { min-width: 120px; max-width: 20%; }
    .status-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .progress-bar {
      width: 100%;
      background-color: #e0e0e0;
      border-radius: 5px;
      overflow: hidden;
    }
    .progress {
      height: 20px;
      background-color: #4CAF50;
      transition: width 0.5s ease-in-out;
    }
    button {
      padding: 5px 10px;
      margin: 2px;
      cursor: pointer;
    }
    .section-header {
      background-color: #e9ecef;
      font-weight: bold;
    }
    .section-header td {
      padding: 10px;
    }
    @media (max-width: 768px) {
      table {
        font-size: 12px;
      }
      th, td {
        padding: 6px;
      }
      .system-column, .registrar-column {
        display: none;
      }
      .operation-column {
        width: auto;
      }
      button {
        padding: 3px 6px;
        font-size: 12px;
      }
      .less-important-column {
        display: none;
      }
    }
    
    .domain-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.4);
    }
    
    .domain-modal-content {
      background-color: #fefefe;
      margin: 10% auto;
      padding: 20px;
      border: 1px solid #888;
      width: 80%;
      max-width: 600px;
      border-radius: 5px;
    }
    
    .domain-modal-close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .domain-property {
      margin-bottom: 10px;
    }
    
    .domain-property-label {
      font-weight: bold;
    }
  </style>
  </head>
  <body class="${isAdmin ? 'admin-page' : ''}">
    <div class="container${isAdmin ? ' admin-container' : ''}">
        <h1>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</h1>
        <div class="admin-link">${adminLink}</div>
        
        ${adminTools}
  
        <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="status-column">状态</th>
              <th class="domain-column">域名</th>
              <th class="system-column">系统</th>
              <th class="registrar-column">注册商</th>
              <th class="date-column">注册日期</th>
              <th class="date-column">到期日期</th>
              <th class="days-column">剩余天数</th>
              <th class="progress-column">进度</th>
              ${isAdmin ? '<th class="operation-column">操作</th>' : ''}
            </tr>
          </thead>
          <tbody>
            <tr class="section-header"><td colspan="${isAdmin ? '9' : '8'}"><h2>CF顶级域名</h2></td></tr>
            ${cfTopLevelTable}
            <tr class="section-separator"><td colspan="${isAdmin ? '9' : '8'}"></td></tr>
            <tr class="section-header"><td colspan="${isAdmin ? '9' : '8'}"><h2>CF二级域名or自定义域名</h2></td></tr>
            ${cfSecondLevelAndCustomTable}
          </tbody>
        </table>
      </div>
  
      ${isAdmin ? `
        <div>
          <h2>添加CF二级域名or自定义域名</h2>
          <form id="addCustomDomainForm">
            <input type="text" id="newDomain" placeholder="域名" required>
            <input type="text" id="newSystem" placeholder="系统" required>
            <input type="text" id="newRegistrar" placeholder="注册商" required>
            <input type="date" id="newRegistrationDate" required>
            <input type="date" id="newExpirationDate" required>
            <button type="submit">添加</button>
          </form>
        </div>
      ` : ''}
    </div>
    
    <!-- 域名属性模态框 -->
    <div id="domainPropsModal" class="domain-modal">
      <div class="domain-modal-content">
        <span class="domain-modal-close">&times;</span>
        <h2>域名属性</h2>
        <div id="domainPropsContent"></div>
      </div>
    </div>
    
    <script>
  
    async function editDomain(domain, button) {
      const row = button.closest('tr');
      const cells = row.querySelectorAll('.editable');
      
      if (button.textContent === '编辑') {
        button.textContent = '保存';
        cells.forEach(cell => {
          const input = document.createElement('input');
          input.value = cell.textContent;
          cell.textContent = '';
          cell.appendChild(input);
        });
      } else {
        button.textContent = '编辑';
        const updatedData = {
          domain: domain,
          registrar: cells[0].querySelector('input').value,
          registrationDate: cells[1].querySelector('input').value,
          expirationDate: cells[2].querySelector('input').value
        };
    
        try {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
            },
            body: JSON.stringify(updatedData)
          });
    
          if (response.ok) {
            cells.forEach(cell => {
              cell.textContent = cell.querySelector('input').value;
            });
            alert('更新成功');
          } else {
            throw new Error('更新失败');
          }
        } catch (error) {
          alert('更新失败: ' + error.message);
          location.reload();
        }
      }
    }
    
    async function deleteDomain(domain) {
      const isCFTopLevel = domain.split('.').length === 2;
      
      let confirmMessage = '确定要删除这个域名吗？';
      if (isCFTopLevel) {
        confirmMessage = '注意：这将只从列表中删除此域名的记录，但不会从Cloudflare中删除域名。下次同步时可能重新获取此域名。确定要继续吗？';
      }
      
      if (confirm(confirmMessage)) {
        try {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
            },
            body: JSON.stringify({
              action: 'delete',
              domain: domain
            })
          });
    
          if (response.ok) {
            alert('删除成功');
            location.reload();
          } else {
            throw new Error('删除失败');
          }
        } catch (error) {
          alert('删除失败: ' + error.message);
        }
      }
    }
    
    document.addEventListener('click', function(event) {
      if (event.target.dataset.action === 'update-whois') {
        updateWhoisInfo(event.target.dataset.domain);
      } else if (event.target.dataset.action === 'query-whois') {
        queryWhoisInfo(event.target.dataset.domain);
      } else if (event.target.dataset.action === 'view-props') {
        viewDomainProps(event.target.dataset.domain);
      } else if (event.target.dataset.action === 'reset-custom') {
        resetCustomFlag(event.target.dataset.domain);
      }
    });
    
    async function updateWhoisInfo(domain) {
      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
          },
          body: JSON.stringify({
            action: 'update-whois',
            domain: domain
          })
        });
    
        if (response.ok) {
          alert('WHOIS信息更新成功');
          location.reload();
        } else {
          throw new Error('WHOIS信息更新失败');
        }
      } catch (error) {
        alert('WHOIS信息更新失败: ' + error.message);
      }
    }
    
    async function queryWhoisInfo(domain) {
      try {
        const response = await fetch('/whois/' + domain);
        const data = await response.json();
    
        if (data.error) {
          alert('查询WHOIS信息失败: ' + data.message);
        } else {
          alert('WHOIS信息：\\n' + data.rawData);
        }
      } catch (error) {
        alert('查询WHOIS信息失败: ' + error.message);
      }
    }
    
    // 域名属性查看功能
    async function viewDomainProps(domain) {
      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
          },
          body: JSON.stringify({
            action: 'get-props',
            domain: domain
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.props) {
            const props = result.props;
            let content = '';
            
            // 格式化属性显示
            content += createPropertyHTML('域名', domain);
            content += createPropertyHTML('自定义域名', props.isCustom ? '是' : '否');
            content += createPropertyHTML('系统', props.system || 'Unknown');
            content += createPropertyHTML('注册商', props.registrar || 'Unknown');
            content += createPropertyHTML('注册日期', props.registrationDate || 'Unknown');
            content += createPropertyHTML('到期日期', props.expirationDate || 'Unknown');
            if (props.parentZone) {
              content += createPropertyHTML('父域名', props.parentZone);
            }
            
            document.getElementById('domainPropsContent').innerHTML = content;
            document.getElementById('domainPropsModal').style.display = 'block';
          } else {
            throw new Error('获取属性失败');
          }
        } else {
          throw new Error('获取属性失败');
        }
      } catch (error) {
        alert('获取属性失败: ' + error.message);
      }
    }
    
    function createPropertyHTML(label, value) {
      return '<div class="domain-prop">' +
             '<span class="domain-prop-label">' + label + ':</span> ' +
             '<span class="domain-prop-value">' + value + '</span>' +
             '</div>';
    }
    
    // 关闭模态框
    document.querySelector('.domain-modal-close').addEventListener('click', function() {
      document.getElementById('domainPropsModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
      if (event.target == document.getElementById('domainPropsModal')) {
        document.getElementById('domainPropsModal').style.display = 'none';
      }
    });
    
    // 重置自定义标记功能
    async function resetCustomFlag(domain) {
      if (confirm('确定要将 ' + domain + ' 重置为非自定义域名吗？这将使其在下次同步时按照Cloudflare的情况处理。')) {
        try {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
            },
            body: JSON.stringify({
              action: 'reset-custom',
              domain: domain
            })
          });
          
          if (response.ok) {
            alert('域名类型重置成功！下次同步时将根据Cloudflare中的状态处理此域名。');
            location.reload();
          } else {
            throw new Error('重置失败');
          }
        } catch (error) {
          alert('重置失败: ' + error.message);
        }
      }
    }

    ${isAdmin ? `
      document.getElementById('addCustomDomainForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const domain = document.getElementById('newDomain').value;
        const system = document.getElementById('newSystem').value;
        const registrar = document.getElementById('newRegistrar').value;
        const registrationDate = document.getElementById('newRegistrationDate').value;
        const expirationDate = document.getElementById('newExpirationDate').value;

        fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(':' + '${ADMIN_PASSWORD}')
          },
          body: JSON.stringify({
            action: 'add',
            domain: domain,
            system: system,
            registrar: registrar,
            registrationDate: registrationDate,
            expirationDate: expirationDate
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('添加成功');
            location.reload();
          } else {
            alert('添加失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('添加失败');
        });
      });
      
      document.getElementById('syncCloudflareBtn').addEventListener('click', async function() {
        if (confirm('确定要同步Cloudflare域名列表吗？这将更新域名状态并可能移除已不存在的域名。')) {
          try {
            const statusEl = document.getElementById('syncStatus');
            statusEl.textContent = '正在同步...';
            
            const response = await fetch('/api/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(':${ADMIN_PASSWORD}')
              },
              body: JSON.stringify({
                action: 'sync-cloudflare'
              })
            });
            
            const result = await response.json();
            if (result.success) {
              statusEl.textContent = "同步成功! 共获取" + result.count + "个域名";
              
              // 显示获取到的域名列表
              if (result.domains && result.domains.length > 0) {
                const domainList = result.domains.join('\\n');
                alert("成功同步以下域名:\\n\\n" + domainList);
              }
              
              setTimeout(() => {
                location.reload();
              }, 1500);
            } else {
              throw new Error(result.message || '同步失败');
            }
          } catch (error) {
            document.getElementById('syncStatus').textContent = '同步失败: ' + error.message;
          }
        }
      });
    ` : ''}
    </script>
    ${footerHTML}
    </body>
  </html>
  `;
}

function generateHTMLCards(domains, isAdmin) {
  const categorizedDomains = categorizeDomains(domains);

  console.log("Categorized domains:", categorizedDomains);

  const renderInfoItem = (label, value, extraClass = '') => `
    <div class="info-item${extraClass ? ` ${extraClass}` : ''}">
      <span class="info-label">${escapeHtml(label)}</span>
      <span class="info-value">${escapeHtml(getDisplayValue(value))}</span>
    </div>
  `;

  const renderActionButtons = (presentation) => {
    if (!isAdmin) {
      return '';
    }

    return `
      <div class="card-actions">
        <button type="button" data-action="view-props" data-domain="${escapeHtml(presentation.domain)}">查看属性</button>
        <button type="button" data-action="update-whois" data-domain="${escapeHtml(presentation.domain)}">更新 WHOIS</button>
        <button type="button" data-action="query-whois" data-domain="${escapeHtml(presentation.domain)}">查询 WHOIS</button>
        <button type="button" data-action="delete-domain" data-domain="${escapeHtml(presentation.domain)}">删除</button>
        ${presentation.isCustom ? `<button type="button" data-action="reset-custom" data-domain="${escapeHtml(presentation.domain)}">重置为非自定义</button>` : ''}
      </div>
    `;
  };

  const renderEditor = (presentation) => {
    if (!isAdmin) {
      return '';
    }

    const registrarValue = escapeHtml(getInputValue(presentation.registrarText));
    const parentRegistrationValue = escapeHtml(getInputValue(presentation.parentRegistrationDateText));
    const parentExpirationValue = escapeHtml(getInputValue(presentation.parentExpirationDateText));
    const secondLevelRegistrationValue = escapeHtml(getInputValue(presentation.secondLevelRegistrationDateText));
    const secondLevelExpirationValue = escapeHtml(getInputValue(presentation.secondLevelExpirationDateText));
    const editorHint = presentation.missingSecondLevelDates
      ? '<div class="editor-hint">KV 里没有读到二级域名的注册时间或到期时间，请在这里补充后保存。</div>'
      : '';

    if (presentation.isNestedDomain) {
      return `
        <details class="editor-panel"${presentation.missingSecondLevelDates ? ' open' : ''}>
          <summary>编辑一级域名 / 二级域名时间</summary>
          ${editorHint}
          <form class="domain-edit-form" data-domain="${escapeHtml(presentation.domain)}" data-nested="true">
            <div class="editor-grid">
              <label class="editor-field">
                <span>注册商</span>
                <input type="text" name="registrar" value="${registrarValue}" placeholder="可选">
              </label>
              <label class="editor-field">
                <span>一级域名注册日期</span>
                <input type="date" name="parentRegistrationDate" value="${parentRegistrationValue}">
              </label>
              <label class="editor-field">
                <span>一级域名到期时间</span>
                <input type="date" name="parentExpirationDate" value="${parentExpirationValue}">
              </label>
              <label class="editor-field">
                <span>二级域名注册日期</span>
                <input type="date" name="secondLevelRegistrationDate" value="${secondLevelRegistrationValue}">
              </label>
              <label class="editor-field">
                <span>二级域名到期时间</span>
                <input type="date" name="secondLevelExpirationDate" value="${secondLevelExpirationValue}">
              </label>
            </div>
            <div class="editor-actions">
              <button type="submit">保存</button>
            </div>
          </form>
        </details>
      `;
    }

    return `
      <details class="editor-panel">
        <summary>编辑域名信息</summary>
        <form class="domain-edit-form" data-domain="${escapeHtml(presentation.domain)}" data-nested="false">
          <div class="editor-grid">
            <label class="editor-field">
              <span>注册商</span>
              <input type="text" name="registrar" value="${registrarValue}" placeholder="可选">
            </label>
            <label class="editor-field">
              <span>注册日期</span>
              <input type="date" name="registrationDate" value="${parentRegistrationValue}">
            </label>
            <label class="editor-field">
              <span>到期时间</span>
              <input type="date" name="expirationDate" value="${parentExpirationValue}">
            </label>
          </div>
          <div class="editor-actions">
            <button type="submit">保存</button>
          </div>
        </form>
      </details>
    `;
  };

  const renderDomainCard = (info, variant) => {
    const presentation = buildDomainPresentation(info);
    const progressTitle = `${presentation.progressPercentage.toFixed(2)}%`;
    const daysRemainingText = Number.isFinite(presentation.daysRemaining)
      ? `${presentation.daysRemaining} 天`
      : 'Unknown';
    const whoisErrorMessage = (!hasCompleteWhoisData(presentation) && presentation.whoisError)
      ? `
        <div class="card-alert">
          <strong>WHOIS 错误：</strong>${escapeHtml(presentation.whoisError)}
        </div>
      `
      : '';
    const missingNotice = presentation.missingSecondLevelDates
      ? `
        <div class="card-note">
          二级域名注册时间 / 到期时间未录入，当前提醒先按一级域名时间兜底展示。
        </div>
      `
      : '';

    const infoItems = variant === 'top-level'
      ? [
          renderInfoItem('系统', presentation.system),
          renderInfoItem('注册商', presentation.registrarText),
          renderInfoItem('注册日期', presentation.parentRegistrationDateText),
          renderInfoItem('到期时间', presentation.parentExpirationDateText),
          renderInfoItem('监控口径', presentation.effectiveSourceText),
          renderInfoItem('剩余天数', daysRemainingText, 'info-item-strong')
        ].join('')
      : presentation.isNestedDomain
        ? [
            renderInfoItem('系统', presentation.system),
            renderInfoItem('注册商', presentation.registrarText),
            renderInfoItem('一级域名', presentation.parentDomainName),
            renderInfoItem('一级域名注册日期', presentation.parentRegistrationDateText),
            renderInfoItem('一级域名到期时间', presentation.parentExpirationDateText),
            renderInfoItem('二级域名注册日期', presentation.secondLevelRegistrationDateText),
            renderInfoItem('二级域名到期时间', presentation.secondLevelExpirationDateText),
            renderInfoItem('当前监控口径', presentation.effectiveSourceText),
            renderInfoItem('当前监控到期', presentation.effectiveExpirationDateText, 'info-item-strong'),
            renderInfoItem('剩余天数', daysRemainingText, 'info-item-strong')
          ].join('')
        : [
            renderInfoItem('系统', presentation.system),
            renderInfoItem('注册商', presentation.registrarText),
            renderInfoItem('注册日期', presentation.parentRegistrationDateText),
            renderInfoItem('到期时间', presentation.parentExpirationDateText),
            renderInfoItem('监控口径', presentation.effectiveSourceText),
            renderInfoItem('剩余天数', daysRemainingText, 'info-item-strong')
          ].join('');

    return `
      <article class="domain-card${presentation.missingSecondLevelDates ? ' domain-card-missing' : ''}">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="status-dot" style="background-color: ${getStatusColor(presentation.daysRemaining)};" title="${getStatusTitle(presentation.daysRemaining)}"></span>
            <div>
              <h3>${escapeHtml(presentation.domain)}</h3>
              <div class="card-meta">${escapeHtml(getDisplayValue(presentation.system))}</div>
            </div>
          </div>
          <div class="card-badge">${escapeHtml(daysRemainingText)}</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${presentation.progressPercentage}%;" title="${progressTitle}"></div>
        </div>
        <div class="info-grid">
          ${infoItems}
        </div>
        ${whoisErrorMessage}
        ${missingNotice}
        ${renderActionButtons(presentation)}
        ${renderEditor(presentation)}
      </article>
    `;
  };

  const renderColumn = (title, description, domainList, variant) => {
    const cards = Array.isArray(domainList) && domainList.length
      ? domainList.map(info => renderDomainCard(info, variant)).join('')
      : '<div class="empty-state">暂无域名</div>';

    return `
      <section class="column-panel">
        <div class="panel-header">
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <div class="card-list">
          ${cards}
        </div>
      </section>
    `;
  };

  const topLevelColumn = renderColumn(
    'CF 顶级域名',
    '展示 Cloudflare 账户下直接托管的顶级域名。',
    categorizedDomains.cfTopLevel,
    'top-level'
  );

  const secondLevelColumn = renderColumn(
    'CF 二级域名 / 自定义域名',
    '这里会同时展示一级域名时间和二级域名时间。二级域名时间优先从 KV 读取，缺失时可在后台补录。',
    categorizedDomains.cfSecondLevelAndCustom,
    'nested'
  );

  const adminLink = isAdmin
    ? '<span>当前为后台管理页面</span> | <a href="/">返回前台</a>'
    : '<a href="/admin">进入后台管理</a>';

  const adminTools = isAdmin ? `
    <div class="toolbar">
      <div class="toolbar-buttons">
        <button id="saveAllDomainsBtn" class="primary-btn">保存全部修改</button>
        <button id="updateAllWhoisBtn" class="primary-btn">全局更新WHOIS</button>
        <button id="syncCloudflareBtn" class="primary-btn">同步 Cloudflare 域名</button>
      </div>
      <div class="toolbar-meta">
        <span id="saveStatus" class="toolbar-status"></span>
        <span id="whoisStatus" class="toolbar-status"></span>
        <span id="syncStatus" class="toolbar-status"></span>
      </div>
    </div>
  ` : '';

  const addDomainPanel = isAdmin ? `
    <section class="add-domain-panel">
      <div class="panel-header">
        <h2>添加 CF 二级域名 / 自定义域名</h2>
        <p>一级域名时间用于父域名信息，二级域名时间用于当前域名本身；二级域名时间可以先留空，后续再补。</p>
      </div>
      <form id="addCustomDomainForm" class="add-domain-form">
        <label class="editor-field">
          <span>域名</span>
          <input type="text" id="newDomain" placeholder="例如: sub.example.com" required>
        </label>
        <label class="editor-field">
          <span>系统</span>
          <input type="text" id="newSystem" placeholder="Cloudflare / Custom" required>
        </label>
        <label class="editor-field">
          <span>注册商</span>
          <input type="text" id="newRegistrar" placeholder="可选">
        </label>
        <label class="editor-field">
          <span>一级域名注册日期</span>
          <input type="date" id="newRegistrationDate">
        </label>
        <label class="editor-field">
          <span>一级域名到期时间</span>
          <input type="date" id="newExpirationDate">
        </label>
        <label class="editor-field">
          <span>二级域名注册日期</span>
          <input type="date" id="newSecondLevelRegistrationDate">
        </label>
        <label class="editor-field">
          <span>二级域名到期时间</span>
          <input type="date" id="newSecondLevelExpirationDate">
        </label>
        <div class="editor-actions">
          <button type="submit">添加</button>
        </div>
      </form>
    </section>
  ` : '';

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</title>
  <link rel="icon" href="/favicon.svg?v=${VERSION}" sizes="any" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico?v=${VERSION}" type="image/svg+xml">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: linear-gradient(180deg, #eef4ff 0%, #f6f8fb 100%);
      color: #1f2937;
    }
    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 8px 60px;
    }
    footer {
      position: relative;
      left: 0;
      bottom: 0;
      width: 100%;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 32px;
    }
    .admin-link {
      margin-bottom: 20px;
      color: #4b5563;
    }
    .admin-link a {
      color: #2563eb;
      text-decoration: none;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 20px 0 28px;
    }
    .toolbar-status {
      color: #4b5563;
    }
    .primary-btn,
    button {
      appearance: none;
      border: 1px solid #d0d7e2;
      background: #fff;
      color: #111827;
      border-radius: 10px;
      padding: 8px 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .primary-btn {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
    }
    .domain-columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      align-items: start;
    }
    .column-panel,
    .add-domain-panel {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #dbe3ef;
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(10px);
    }
    .panel-header {
      padding: 22px 22px 0;
    }
    .panel-header h2 {
      margin: 0;
      font-size: 22px;
    }
    .panel-header p {
      margin: 8px 0 0;
      color: #526071;
      font-size: 14px;
    }
    .card-list {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .domain-card {
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      padding: 18px;
      background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
    }
    .domain-card-missing {
      border-color: #f59e0b;
      box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.25);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .card-title-wrap {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      min-width: 0;
    }
    .card-title-wrap h3 {
      margin: 0;
      font-size: 20px;
      word-break: break-all;
    }
    .card-meta {
      margin-top: 4px;
      color: #64748b;
      font-size: 13px;
    }
    .card-badge {
      flex-shrink: 0;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: bold;
    }
    .status-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 7px;
      flex-shrink: 0;
    }
    .progress-track {
      width: 100%;
      height: 8px;
      margin: 16px 0 18px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      transition: width 0.3s ease;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .info-item {
      padding: 12px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      min-width: 0;
    }
    .info-item-strong {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .info-label {
      display: block;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .info-value {
      display: block;
      font-size: 15px;
      font-weight: 600;
      word-break: break-all;
    }
    .card-alert,
    .card-note,
    .editor-hint {
      margin-top: 14px;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 14px;
    }
    .card-alert {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #be123c;
    }
    .card-note,
    .editor-hint {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #c2410c;
    }
    .card-actions,
    .editor-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .editor-panel {
      margin-top: 14px;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      background: #f8fafc;
    }
    .editor-panel summary {
      cursor: pointer;
      list-style: none;
      padding: 14px 16px;
      font-weight: 600;
    }
    .editor-panel summary::-webkit-details-marker {
      display: none;
    }
    .domain-edit-form,
    .add-domain-form {
      padding: 0 16px 16px;
    }
    .editor-grid,
    .add-domain-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .editor-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: #334155;
      font-size: 14px;
    }
    .editor-field input {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
      background: #fff;
    }
    .add-domain-panel {
      margin-top: 24px;
      overflow: hidden;
    }
    .empty-state {
      margin: 22px;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 22px;
      color: #64748b;
      text-align: center;
      background: #f8fafc;
    }
    .domain-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.4);
    }
    .domain-modal-content {
      background-color: #fff;
      margin: 8% auto;
      padding: 24px;
      border: 1px solid #dbe3ef;
      width: min(720px, calc(100% - 24px));
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    }
    .domain-modal-close {
      color: #94a3b8;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      line-height: 1;
    }
    .domain-property {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .domain-property-label {
      color: #64748b;
      flex-shrink: 0;
    }
    .domain-property-value {
      text-align: right;
      word-break: break-all;
      font-weight: 600;
    }
    @media (max-width: 960px) {
      .domain-columns,
      .info-grid,
      .editor-grid,
      .add-domain-form {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      body {
        padding: 14px;
      }
      .container {
        padding: 0 0 60px;
      }
      h1 {
        font-size: 28px;
      }
      .card-header {
        flex-direction: column;
      }
      .card-badge {
        align-self: flex-start;
      }
      .domain-property {
        flex-direction: column;
        gap: 6px;
      }
      .domain-property-value {
        text-align: left;
      }
    }
  </style>
  </head>
  <body>
    <div class="container">
      <h1>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</h1>
      <div class="admin-link">${adminLink}</div>
      ${adminTools}
      <div class="domain-columns">
        ${topLevelColumn}
        ${secondLevelColumn}
      </div>
      ${addDomainPanel}
    </div>

    <div id="domainPropsModal" class="domain-modal">
      <div class="domain-modal-content">
        <span class="domain-modal-close">&times;</span>
        <h2>域名属性</h2>
        <div id="domainPropsContent"></div>
      </div>
    </div>

    <div id="loadingOverlay" class="loading-overlay" aria-hidden="true">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <div id="loadingMessage" class="loading-message">加载中...</div>
      </div>
    </div>

    ${isAdmin ? `
      <section id="whoisResultPanel" class="panel whois-result-panel" hidden>
        <div class="panel-head">
          <h2>WHOIS 查询结果</h2>
          <p id="whoisResultSummary">在这里查看详细查询过程和完整 WHOIS 文本。</p>
        </div>
        <div class="whois-result-body">
          <div id="whoisResultMeta" class="whois-result-meta"></div>
          <div class="whois-result-grid">
            <div class="whois-trace-block">
              <h3>查询过程</h3>
              <div id="whoisTraceList" class="whois-trace-list"></div>
            </div>
            <div class="whois-raw-block">
              <h3>原始 WHOIS</h3>
              <pre id="whoisRawData" class="whois-raw-data"></pre>
            </div>
          </div>
        </div>
      </section>
    ` : ''}

    <script>
    const adminAuthHeader = 'Basic ' + btoa(':${ADMIN_PASSWORD}');

    function createPropertyHTML(label, value) {
      return '<div class="domain-property">' +
        '<span class="domain-property-label">' + label + '</span>' +
        '<span class="domain-property-value">' + (value || 'Unknown') + '</span>' +
        '</div>';
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    const whoisResultPanel = document.getElementById('whoisResultPanel');
    const whoisResultSummary = document.getElementById('whoisResultSummary');
    const whoisResultMeta = document.getElementById('whoisResultMeta');
    const whoisTraceList = document.getElementById('whoisTraceList');
    const whoisRawData = document.getElementById('whoisRawData');
    let loadingCounter = 0;

    function showLoading(message) {
      loadingCounter += 1;
      if (loadingMessage) {
        loadingMessage.textContent = message || '加载中...';
      }
      if (loadingOverlay) {
        loadingOverlay.classList.add('is-visible');
        loadingOverlay.setAttribute('aria-hidden', 'false');
      }
    }

    function hideLoading() {
      loadingCounter = Math.max(0, loadingCounter - 1);
      if (loadingCounter > 0) {
        return;
      }
      if (loadingOverlay) {
        loadingOverlay.classList.remove('is-visible');
        loadingOverlay.setAttribute('aria-hidden', 'true');
      }
    }

    async function withLoading(message, task) {
      showLoading(message);
      try {
        return await task();
      } finally {
        hideLoading();
      }
    }

    function escapeClientHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderWhoisResult(data, domain) {
      if (!whoisResultPanel || !whoisResultSummary || !whoisResultMeta || !whoisTraceList || !whoisRawData) {
        return;
      }

      whoisResultPanel.hidden = false;
      whoisResultSummary.textContent = data.error
        ? ('查询失败：' + (data.message || '未知错误'))
        : ('查询域名：' + domain + '；最终展示来源：' + (data.source || 'unknown') + '；实际查询域名：' + (data.lookupDomain || domain));

      const chips = [];
      if (!data.error) {
        chips.push('<span class="whois-meta-chip">展示来源：' + escapeClientHtml(data.source || 'unknown') + '</span>');
        chips.push('<span class="whois-meta-chip">实际查询域名：' + escapeClientHtml(data.lookupDomain || domain) + '</span>');
        if (data.parsed && data.parsed.registrar) {
          chips.push('<span class="whois-meta-chip">注册商：' + escapeClientHtml(data.parsed.registrar) + '</span>');
        }
        if (data.parsed && data.parsed.expirationDate) {
          chips.push('<span class="whois-meta-chip">到期时间：' + escapeClientHtml(data.parsed.expirationDate) + '</span>');
        }
      }
      whoisResultMeta.innerHTML = chips.join('');

      const traceItems = Array.isArray(data.trace) ? data.trace : [];
      whoisTraceList.innerHTML = traceItems.length
        ? traceItems.map(function(item, index) {
            const stateClass = item.status === 'success' ? 'is-success' : (item.status === 'failed' ? 'is-failed' : 'is-incomplete');
            return '<div class="whois-trace-item ' + stateClass + '">' +
              '<div class="whois-trace-title">' +
                '<span>步骤 ' + (index + 1) + ' · ' + escapeClientHtml(item.source || 'unknown') + '</span>' +
                '<span>' + escapeClientHtml(item.lookupDomain || domain) + '</span>' +
              '</div>' +
              '<div class="whois-trace-message">' + escapeClientHtml(item.message || '') + '</div>' +
            '</div>';
          }).join('')
        : '<div class="whois-trace-item"><div class="whois-trace-message">没有可展示的查询过程。</div></div>';

      whoisRawData.textContent = data.rawData || data.message || '';
      whoisResultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const interactiveTableConfigs = {
      top: ${JSON.stringify(topLevelColumns)},
      nested: ${JSON.stringify(nestedColumns)}
    };

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          '<button type="button" class="column-menu-trigger" data-column-key="' + column.key + '" aria-label="打开' + column.label + '排序和筛选">▼</button>' +
          '<div class="column-menu">' +
            '<div class="column-menu-label">' + column.label + '</div>' +
            '<div class="column-menu-actions">' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>' +
            '<div class="menu-divider"></div>' +
            '<label class="menu-filter-title" for="filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key + '">筛选</label>' +
            '<div class="column-filter-wrap">' +
              '<input type="text" id="filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key + '" class="column-filter" data-column-key="' + column.key + '" placeholder="输入包含内容" autocomplete="off">' +
              '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
            '</div>' +
            '<div class="menu-filter-hint">支持模糊匹配，例如域名、日期或注册商关键字。</div>' +
          '</div>' +
        '</div>';
        return;
        cell.innerHTML = '<div class="header-title">' + column.label + '</div>' +
          '<div class="header-sort-buttons">' +
            '<button type="button" class="sort-btn" data-sort-button="asc" data-column-key="' + column.key + '">升</button>' +
            '<button type="button" class="sort-btn" data-sort-button="desc" data-column-key="' + column.key + '">降</button>' +
            '<button type="button" class="sort-btn" data-sort-button="clear" data-column-key="' + column.key + '">清</button>' +
          '</div>';
      });

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
      return;
      const filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      filterRow.innerHTML = columns.map(function(column) {
        return '<th class="' + column.className + '">' +
          '<input type="text" class="column-filter" data-column-key="' + column.key + '" placeholder="筛选" autocomplete="off">' +
        '</th>';
      }).join('');
      headerRow.parentNode.appendChild(filterRow);

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function getInteractiveTableState(table) {
      if (!table._interactiveState) {
        table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
      }
      return table._interactiveState;
    }

    function getTableColumns(table) {
      if (table.classList.contains('nested-table')) {
        return interactiveTableConfigs.nested;
      }
      return interactiveTableConfigs.top;
    }

    function normalizeSortValue(value, sortType) {
      if (sortType === 'number' || sortType === 'date') {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
      }
      return String(value || '').toLowerCase();
    }

    function syncTableWrapperMenuSpacing(targetTable) {
      const tables = targetTable
        ? [targetTable]
        : Array.from(document.querySelectorAll('.js-interactive-table'));

      tables.forEach(function(table) {
        const wrapper = table && table.closest('.table-wrapper');
        const panel = table && table.closest('.panel');
        if (!wrapper) {
          if (panel) {
            panel.style.marginBottom = '';
          }
          return;
        }

        const openMenu = table.querySelector('.sortable-header.menu-open .column-menu');
        if (!openMenu) {
          wrapper.style.paddingBottom = '';
          if (panel) {
            panel.style.marginBottom = '';
          }
          return;
        }

        const panelRect = panel ? panel.getBoundingClientRect() : null;
        const menuRect = openMenu.getBoundingClientRect();
        const panelOverflow = panelRect ? Math.max(0, Math.ceil(menuRect.bottom - panelRect.bottom + 20)) : 0;
        wrapper.style.paddingBottom = '';
        if (panel) {
          panel.style.marginBottom = panelOverflow > 0 ? panelOverflow + 'px' : '';
        }
      });
    }

    function closeColumnMenus(exceptHeaderCell) {
      document.querySelectorAll('.sortable-header.menu-open').forEach(function(cell) {
        if (cell !== exceptHeaderCell) {
          cell.classList.remove('menu-open');
        }
      });
      syncTableWrapperMenuSpacing();
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const hasSort = state.sortKey === columnKey && Boolean(state.sortDirection);
        const hasFilter = String(state.filters[columnKey] || '').trim() !== '';
        const stateEl = cell.querySelector('.header-state');
        const trigger = cell.querySelector('.column-menu-trigger');
        const filterInput = cell.querySelector('.column-filter');
        const clearButton = cell.querySelector('.filter-clear-btn');

        if (stateEl) {
          stateEl.textContent = hasSort
            ? (state.sortDirection === 'asc' ? '↑' : '↓') + (hasFilter ? ' 筛' : '')
            : (hasFilter ? '筛' : '');
        }

        if (trigger) {
          trigger.classList.toggle('is-active', hasSort || hasFilter);
        }

        if (filterInput && filterInput.value !== String(state.filters[columnKey] || '')) {
          filterInput.value = String(state.filters[columnKey] || '');
        }

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    function refreshInteractiveTable(table) {
      if (!table || !table.classList.contains('js-interactive-table')) {
        return;
      }

      const columns = getTableColumns(table);
      const state = getInteractiveTableState(table);
      const tbody = table.tBodies[0];
      if (!tbody) {
        return;
      }

      const allRows = Array.from(tbody.querySelectorAll('tr.table-data-row'));
      const visibleRows = allRows.filter(function(row) {
        return columns.every(function(column) {
          const filterValue = String(state.filters[column.key] || '').trim().toLowerCase();
          if (!filterValue) {
            return true;
          }

          const rowValue = String(row.getAttribute('data-filter-' + column.key) || '').toLowerCase();
          return rowValue.includes(filterValue);
        });
      });

      const sortColumn = columns.find(function(column) {
        return column.key === state.sortKey;
      });

      if (sortColumn && state.sortDirection) {
        visibleRows.sort(function(a, b) {
          const aValue = normalizeSortValue(a.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          const bValue = normalizeSortValue(b.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          if (aValue === bValue) {
            const domainA = String(a.getAttribute('data-sort-domain') || '').toLowerCase();
            const domainB = String(b.getAttribute('data-sort-domain') || '').toLowerCase();
            return state.sortDirection === 'desc'
              ? domainB.localeCompare(domainA)
              : domainA.localeCompare(domainB);
          }
          return state.sortDirection === 'desc'
            ? (aValue < bValue ? 1 : -1)
            : (aValue > bValue ? 1 : -1);
        });
      }

      const hiddenRows = allRows.filter(function(row) {
        return !visibleRows.includes(row);
      });
      const fragment = document.createDocumentFragment();

      visibleRows.forEach(function(row) {
        row.style.display = '';
        fragment.appendChild(row);
      });
      hiddenRows.forEach(function(row) {
        row.style.display = 'none';
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      updateSortButtons(table, state);
      syncTableWrapperMenuSpacing(table);
    }

    function initializeInteractiveTables() {
      document.querySelectorAll('.js-interactive-table').forEach(function(table) {
        enhanceInteractiveTable(table, getTableColumns(table));
        refreshInteractiveTable(table);
      });
    }

    const interactiveTableConfigs = {
      top: ${JSON.stringify(topLevelColumns)},
      nested: ${JSON.stringify(nestedColumns)}
    };

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-title">' + column.label + '</div>' +
          '<div class="header-sort-buttons">' +
            '<button type="button" class="sort-btn" data-sort-button="asc" data-column-key="' + column.key + '">升</button>' +
            '<button type="button" class="sort-btn" data-sort-button="desc" data-column-key="' + column.key + '">降</button>' +
            '<button type="button" class="sort-btn" data-sort-button="clear" data-column-key="' + column.key + '">清</button>' +
          '</div>';
      });

      const filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      filterRow.innerHTML = columns.map(function(column) {
        return '<th class="' + column.className + '">' +
          '<input type="text" class="column-filter" data-column-key="' + column.key + '" placeholder="筛选" autocomplete="off">' +
        '</th>';
      }).join('');
      headerRow.parentNode.appendChild(filterRow);

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function getInteractiveTableState(table) {
      if (!table._interactiveState) {
        table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
      }
      return table._interactiveState;
    }

    function getTableColumns(table) {
      if (table.classList.contains('nested-table')) {
        return interactiveTableConfigs.nested;
      }
      return interactiveTableConfigs.top;
    }

    function normalizeSortValue(value, sortType) {
      if (sortType === 'number' || sortType === 'date') {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
      }
      return String(value || '').toLowerCase();
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sort-btn').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    function refreshInteractiveTable(table) {
      if (!table || !table.classList.contains('js-interactive-table')) {
        return;
      }

      const columns = getTableColumns(table);
      const state = getInteractiveTableState(table);
      const tbody = table.tBodies[0];
      if (!tbody) {
        return;
      }

      const allRows = Array.from(tbody.querySelectorAll('tr.table-data-row'));
      const visibleRows = allRows.filter(function(row) {
        return columns.every(function(column) {
          const filterValue = String(state.filters[column.key] || '').trim().toLowerCase();
          if (!filterValue) {
            return true;
          }

          const rowValue = String(row.getAttribute('data-filter-' + column.key) || '').toLowerCase();
          return rowValue.includes(filterValue);
        });
      });

      const sortColumn = columns.find(function(column) {
        return column.key === state.sortKey;
      });

      if (sortColumn && state.sortDirection) {
        visibleRows.sort(function(a, b) {
          const aValue = normalizeSortValue(a.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          const bValue = normalizeSortValue(b.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          if (aValue === bValue) {
            const domainA = String(a.getAttribute('data-sort-domain') || '').toLowerCase();
            const domainB = String(b.getAttribute('data-sort-domain') || '').toLowerCase();
            return state.sortDirection === 'desc'
              ? domainB.localeCompare(domainA)
              : domainA.localeCompare(domainB);
          }
          return state.sortDirection === 'desc'
            ? (aValue < bValue ? 1 : -1)
            : (aValue > bValue ? 1 : -1);
        });
      }

      const hiddenRows = allRows.filter(function(row) {
        return !visibleRows.includes(row);
      });
      const fragment = document.createDocumentFragment();

      visibleRows.forEach(function(row) {
        row.style.display = '';
        fragment.appendChild(row);
      });
      hiddenRows.forEach(function(row) {
        row.style.display = 'none';
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      updateSortButtons(table, state);
    }

    function initializeInteractiveTables() {
      document.querySelectorAll('.js-interactive-table').forEach(function(table) {
        enhanceInteractiveTable(table, getTableColumns(table));
        refreshInteractiveTable(table);
      });
    }

    async function saveDomain(form) {
      const formData = new FormData(form);
      const payload = {
        domain: form.dataset.domain,
        registrar: formData.get('registrar') || '',
        registrationDate: formData.get('registrationDate') || '',
        expirationDate: formData.get('expirationDate') || ''
      };

      if (form.dataset.nested === 'true') {
        payload.parentRegistrationDate = formData.get('parentRegistrationDate') || '';
        payload.parentExpirationDate = formData.get('parentExpirationDate') || '';
        payload.secondLevelRegistrationDate = formData.get('secondLevelRegistrationDate') || '';
        payload.secondLevelExpirationDate = formData.get('secondLevelExpirationDate') || '';
        payload.registrationDate = payload.parentRegistrationDate;
        payload.expirationDate = payload.parentExpirationDate;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('更新失败');
        }

        alert('更新成功');
        location.reload();
      } catch (error) {
        alert('更新失败: ' + error.message);
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }

    async function deleteDomain(domain) {
      const isCFTopLevel = domain.split('.').length === 2;
      let confirmMessage = '确定要删除这个域名吗？';
      if (isCFTopLevel) {
        confirmMessage = '注意：这将只从列表中删除此域名的记录，不会从 Cloudflare 中删除域名。下次同步时可能重新获取。确定继续吗？';
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify({
            action: 'delete',
            domain
          })
        });

        if (!response.ok) {
          throw new Error('删除失败');
        }

        alert('删除成功');
        location.reload();
      } catch (error) {
        alert('删除失败: ' + error.message);
      }
    }

    async function updateWhoisInfo(domain) {
      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify({
            action: 'update-whois',
            domain
          })
        });

        if (!response.ok) {
          throw new Error('WHOIS 信息更新失败');
        }

        alert('WHOIS 信息更新成功');
        location.reload();
      } catch (error) {
        alert('WHOIS 信息更新失败: ' + error.message);
      }
    }

    async function queryWhoisInfo(domain) {
      try {
        const response = await fetch('/whois/' + domain);
        const data = await response.json();

        if (data.error) {
          alert('查询 WHOIS 失败: ' + data.message);
          return;
        }

        alert('WHOIS 信息：\\n' + data.rawData);
      } catch (error) {
        alert('查询 WHOIS 失败: ' + error.message);
      }
    }

    async function viewDomainProps(domain) {
      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify({
            action: 'get-props',
            domain
          })
        });

        if (!response.ok) {
          throw new Error('获取属性失败');
        }

        const result = await response.json();
        if (!result.success || !result.props) {
          throw new Error(result.message || '获取属性失败');
        }

        const props = result.props;
        let content = '';
        content += createPropertyHTML('域名', domain);
        content += createPropertyHTML('自定义域名', props.isCustom ? '是' : '否');
        content += createPropertyHTML('系统', props.system || 'Unknown');
        content += createPropertyHTML('注册商', props.registrar || 'Unknown');
        content += createPropertyHTML('一级域名注册日期', props.parentRegistrationDate || props.registrationDate || 'Unknown');
        content += createPropertyHTML('一级域名到期时间', props.parentExpirationDate || props.expirationDate || 'Unknown');
        content += createPropertyHTML('二级域名注册日期', props.secondLevelRegistrationDate || 'Unknown');
        content += createPropertyHTML('二级域名到期时间', props.secondLevelExpirationDate || 'Unknown');
        content += createPropertyHTML('WHOIS 实际查询域名', props.whoisLookupDomain || 'Unknown');

        document.getElementById('domainPropsContent').innerHTML = content;
        document.getElementById('domainPropsModal').style.display = 'block';
      } catch (error) {
        alert('获取属性失败: ' + error.message);
      }
    }

    document.addEventListener('click', function(event) {
      const action = event.target.dataset.action;
      if (!action) {
        return;
      }

      const domain = event.target.dataset.domain;
      if (action === 'update-whois') {
        updateWhoisInfo(domain);
      } else if (action === 'query-whois') {
        queryWhoisInfo(domain);
      } else if (action === 'view-props') {
        viewDomainProps(domain);
      } else if (action === 'reset-custom') {
        resetCustomFlag(domain);
      } else if (action === 'delete-domain') {
        deleteDomain(domain);
      }
    });

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        const filterId = 'filter-' + table.className.replace(/\s+/g, '-') + '-' + column.key;
        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          '<button type="button" class="column-menu-trigger" data-column-key="' + column.key + '" aria-label="打开' + column.label + '排序和筛选">▼</button>' +
          '<div class="column-menu">' +
            '<div class="column-menu-label">' + column.label + '</div>' +
            '<div class="column-menu-actions">' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>' +
            '<div class="menu-divider"></div>' +
            '<label class="menu-filter-title" for="' + filterId + '">筛选</label>' +
            '<div class="column-filter-wrap">' +
              '<input type="text" id="' + filterId + '" class="column-filter" data-column-key="' + column.key + '" placeholder="输入包含内容" autocomplete="off">' +
              '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
            '</div>' +
            '<div class="menu-filter-hint">支持模糊匹配，例如域名、日期或注册商关键字。</div>' +
          '</div>' +
        '</div>';
      });

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const hasSort = state.sortKey === columnKey && Boolean(state.sortDirection);
        const hasFilter = String(state.filters[columnKey] || '').trim() !== '';
        const stateEl = cell.querySelector('.header-state');
        const trigger = cell.querySelector('.column-menu-trigger');
        const filterInput = cell.querySelector('.column-filter');
        const clearButton = cell.querySelector('.filter-clear-btn');

        if (stateEl) {
          stateEl.textContent = hasSort
            ? (state.sortDirection === 'asc' ? '↑' : '↓') + (hasFilter ? ' 筛' : '')
            : (hasFilter ? '筛' : '');
        }

        if (trigger) {
          trigger.classList.toggle('is-active', hasSort || hasFilter);
        }

        if (filterInput && filterInput.value !== String(state.filters[columnKey] || '')) {
          filterInput.value = String(state.filters[columnKey] || '');
        }

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    document.querySelectorAll('.admin-inline-input').forEach(function(input) {
      updateAdminFieldState(input);
    });

    document.querySelector('.domain-modal-close').addEventListener('click', function() {
      document.getElementById('domainPropsModal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
      if (event.target === document.getElementById('domainPropsModal')) {
        document.getElementById('domainPropsModal').style.display = 'none';
      }
    });

    async function resetCustomFlag(domain) {
      if (!confirm('确定要将 ' + domain + ' 重置为非自定义域名吗？这会在下次同步时按 Cloudflare 状态处理。')) {
        return;
      }

      try {
        await withLoading('正在重置 ' + domain + ' ...', async function() {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': adminAuthHeader
            },
            body: JSON.stringify({
              action: 'reset-custom',
              domain
            })
          });

          if (!response.ok) {
            throw new Error('重置失败');
          }
        });

        alert('重置成功');
        location.reload();
      } catch (error) {
        alert('重置失败: ' + error.message);
      }
    }

    ${isAdmin ? `
      document.getElementById('addCustomDomainForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const domain = document.getElementById('newDomain').value.trim();
        const payload = {
          action: 'add',
          domain,
          system: document.getElementById('newSystem').value.trim(),
          registrar: document.getElementById('newRegistrar').value.trim(),
          registrationDate: document.getElementById('newRegistrationDate').value,
          expirationDate: document.getElementById('newExpirationDate').value,
          secondLevelRegistrationDate: document.getElementById('newSecondLevelRegistrationDate').value,
          secondLevelExpirationDate: document.getElementById('newSecondLevelExpirationDate').value
        };

        if (domain.split('.').filter(Boolean).length > 2) {
          payload.parentRegistrationDate = payload.registrationDate;
          payload.parentExpirationDate = payload.expirationDate;
        }

        try {
          const result = await withLoading('正在添加域名...', async function() {
            const response = await fetch('/api/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': adminAuthHeader
              },
              body: JSON.stringify(payload)
            });

            return await response.json().then(function(data) {
              return { response: response, result: data };
            });
          });

          if (!result.response.ok || !result.result.success) {
            throw new Error(result.result.error || '添加失败');
          }

          alert('添加成功');
          location.reload();
        } catch (error) {
          alert('添加失败: ' + error.message);
        }
      });

      document.getElementById('saveAllDomainsBtn').addEventListener('click', async function() {
        await saveAllDomains();
      });

      document.getElementById('updateAllWhoisBtn').addEventListener('click', async function() {
        await updateAllWhois();
      });

      document.getElementById('syncCloudflareBtn').addEventListener('click', async function() {
        if (!confirm('确定要同步 Cloudflare 域名列表吗？这会刷新域名状态，并可能移除已不存在的域名记录。')) {
          return;
        }

        const statusEl = document.getElementById('syncStatus');
        statusEl.textContent = '正在同步...';

        try {
          const resultWrapper = await withLoading('正在同步 Cloudflare 域名...', async function() {
            const response = await fetch('/api/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': adminAuthHeader
              },
              body: JSON.stringify({
                action: 'sync-cloudflare'
              })
            });

            return await response.json().then(function(data) {
              return { response: response, result: data };
            });
          });

          const response = resultWrapper.response;
          const result = resultWrapper.result;
          if (!response.ok || !result.success) {
            throw new Error(result.message || '同步失败');
          }

          statusEl.textContent = '同步成功，共获取 ' + result.count + ' 个域名';
          if (result.domains && result.domains.length > 0) {
            alert('成功同步以下域名：\\n\\n' + result.domains.join('\\n'));
          }

          setTimeout(function() {
            location.reload();
          }, 1200);
        } catch (error) {
          statusEl.textContent = '同步失败: ' + error.message;
        }
      });
    ` : ''}
    </script>
    ${footerHTML}
    </body>
  </html>
  `;
}

function generateHTML(domains, isAdmin) {
  const categorizedDomains = categorizeDomains(domains);
  const topLevelColumns = [
    { key: 'status', label: '状态', className: 'status-column', sortType: 'number' },
    { key: 'domain', label: '域名', className: 'domain-column', sortType: 'text' },
    { key: 'system', label: '系统', className: 'system-column', sortType: 'text' },
    { key: 'registrar', label: '注册商', className: 'registrar-column', sortType: 'text' },
    { key: 'registration', label: '注册日期', className: 'date-column', sortType: 'date' },
    { key: 'expiration', label: '到期时间', className: 'date-column', sortType: 'date' },
    { key: 'days', label: '剩余天数', className: 'days-column', sortType: 'number' },
    { key: 'progress', label: '进度', className: 'progress-column', sortType: 'number' }
  ];
  const nestedColumns = [
    { key: 'status', label: '状态', className: 'status-column', sortType: 'number' },
    { key: 'domain', label: '域名', className: 'domain-column', sortType: 'text' },
    { key: 'system', label: '系统', className: 'system-column', sortType: 'text' },
    { key: 'registrar', label: '注册商', className: 'registrar-column', sortType: 'text' },
    { key: 'parentDomain', label: '一级域名', className: 'domain-column', sortType: 'text' },
    { key: 'parentRegistration', label: '一级注册日期', className: 'date-column', sortType: 'date' },
    { key: 'parentExpiration', label: '一级到期时间', className: 'date-column', sortType: 'date' },
    { key: 'secondRegistration', label: '二级注册日期', className: 'date-column', sortType: 'date' },
    { key: 'secondExpiration', label: '二级到期时间', className: 'date-column', sortType: 'date' },
    { key: 'effectiveExpiration', label: '当前监控到期', className: 'date-column', sortType: 'date' },
    { key: 'days', label: '剩余天数', className: 'days-column', sortType: 'number' },
    { key: 'progress', label: '进度', className: 'progress-column', sortType: 'number' }
  ];

  const buildSelectOptions = (items) => {
    const entries = new Map();

    items.forEach((item) => {
      const rawLabel = typeof item === 'object' && item !== null ? item.label : item;
      const rawValue = typeof item === 'object' && item !== null ? item.value : item;
      const label = String(rawLabel || '').trim();
      const value = String(rawValue || label).trim().toLowerCase();

      if (!label || !value || entries.has(value)) {
        return;
      }

      entries.set(value, { value, label });
    });

    return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN', {
      sensitivity: 'base',
      numeric: true
    }));
  };

  const setColumnMeta = (columns, key, patch) => {
    const target = columns.find((column) => column.key === key);
    if (target) {
      Object.assign(target, patch);
    }
  };

  const topLevelPresentationsForFilters = categorizedDomains.cfTopLevel.map((info) => buildDomainPresentation(info));
  const nestedPresentationsForFilters = categorizedDomains.cfSecondLevelAndCustom.map((info) => buildDomainPresentation(info));
  const statusFilterOptions = buildSelectOptions([
    { value: '正常', label: '正常' },
    { value: '注意', label: '注意' },
    { value: '警告', label: '警告' },
    { value: '紧急', label: '紧急' },
    { value: '未知', label: '未知' }
  ]);

  ['status'].forEach((key) => {
    setColumnMeta(topLevelColumns, key, { filterMode: 'select', filterOptions: statusFilterOptions });
    setColumnMeta(nestedColumns, key, { filterMode: 'select', filterOptions: statusFilterOptions });
  });

  [
    ['domain', buildSelectOptions(topLevelPresentationsForFilters.map((item) => item.domain))],
    ['system', buildSelectOptions(topLevelPresentationsForFilters.map((item) => getDisplayValue(item.system)))],
    ['registrar', buildSelectOptions(topLevelPresentationsForFilters.map((item) => item.registrarText))]
  ].forEach(([key, options]) => {
    setColumnMeta(topLevelColumns, key, { filterMode: 'select', filterOptions: options });
  });

  [
    ['domain', buildSelectOptions(nestedPresentationsForFilters.map((item) => item.domain))],
    ['system', buildSelectOptions(nestedPresentationsForFilters.map((item) => getDisplayValue(item.system)))],
    ['registrar', buildSelectOptions(nestedPresentationsForFilters.map((item) => item.registrarText))],
    ['parentDomain', buildSelectOptions(nestedPresentationsForFilters.map((item) => item.parentDomainName))]
  ].forEach(([key, options]) => {
    setColumnMeta(nestedColumns, key, { filterMode: 'select', filterOptions: options });
  });

  ['registration', 'expiration'].forEach((key) => {
    setColumnMeta(topLevelColumns, key, { filterMode: 'range', rangeType: 'date' });
  });

  ['parentRegistration', 'parentExpiration', 'secondRegistration', 'secondExpiration', 'effectiveExpiration'].forEach((key) => {
    setColumnMeta(nestedColumns, key, { filterMode: 'range', rangeType: 'date' });
  });

  setColumnMeta(topLevelColumns, 'days', { filterMode: 'range', rangeType: 'number' });
  setColumnMeta(nestedColumns, 'days', { filterMode: 'range', rangeType: 'number' });
  setColumnMeta(topLevelColumns, 'progress', { filterMode: 'none', sortEnabled: false });
  setColumnMeta(nestedColumns, 'progress', { filterMode: 'none', sortEnabled: false });

  const renderProgressBar = (percentage) => `
    <div class="progress-bar">
      <div class="progress" style="width: ${percentage}%;" title="${percentage.toFixed(2)}%"></div>
    </div>
  `;

  const getStatusMeta = (daysRemaining) => {
    if (!Number.isFinite(daysRemaining)) {
      return { rank: 99, label: '未知' };
    }
    if (daysRemaining <= 7) {
      return { rank: 1, label: '紧急' };
    }
    if (daysRemaining <= 30) {
      return { rank: 2, label: '警告' };
    }
    if (daysRemaining <= 90) {
      return { rank: 3, label: '注意' };
    }
    return { rank: 4, label: '正常' };
  };

  const getComparableDateValue = (value) => {
    const digits = toCompactDateString(value);
    return digits || '99999999';
  };

  const renderAdminInput = ({ name, value, placeholder, type = 'text' }) => {
    const normalizedValue = type === 'date' ? toCompactDateString(value) : getInputValue(value);
    const classes = [
      'admin-inline-input',
      type === 'date' ? 'admin-date-input' : 'admin-text-input',
      normalizedValue ? '' : 'is-missing'
    ].filter(Boolean).join(' ');

    return `
      <input
        type="text"
        class="${classes}"
        name="${name}"
        value="${escapeHtml(normalizedValue)}"
        data-initial-value="${escapeHtml(normalizedValue)}"
        placeholder="${escapeHtml(placeholder)}"
        autocomplete="off"
        ${type === 'date' ? 'inputmode="numeric" maxlength="8"' : ''}
      >
    `;
  };

  const buildRowDataAttributes = (values, prefix) => Object.entries(values).map(([key, value]) => {
    const text = value == null ? '' : String(value);
    return `data-${prefix}-${key}="${escapeHtml(text)}"`;
  }).join(' ');

  const renderHeaderCells = (columns) => columns.map((column) => {
    if (isAdmin) {
      return `<th class="${column.className}">${column.label}</th>`;
    }

    return `
      <th class="${column.className} sortable-header" data-column-key="${column.key}" data-sort-type="${column.sortType}">
        <div class="header-title">${column.label}</div>
        <div class="header-sort-buttons">
          <button type="button" class="sort-btn" data-sort-button="asc" data-column-key="${column.key}">升</button>
          <button type="button" class="sort-btn" data-sort-button="desc" data-column-key="${column.key}">降</button>
          <button type="button" class="sort-btn" data-sort-button="clear" data-column-key="${column.key}">清</button>
        </div>
      </th>
    `;
  }).join('');

  const renderFilterRow = (columns) => {
    if (isAdmin) {
      return '';
    }

    return `
      <tr class="filter-row">
        ${columns.map((column) => `
          <th class="${column.className}">
            <input
              type="text"
              class="column-filter"
              data-column-key="${column.key}"
              placeholder="筛选"
              autocomplete="off"
            >
          </th>
        `).join('')}
      </tr>
    `;
  };

  const renderCompactDateField = (label, name, value) => {
    const compactValue = escapeHtml(toCompactDateString(value));
    const isoValue = escapeHtml(toIsoDateString(value));

    return `
      <label class="editor-field">
        <span>${label}</span>
        <div class="compact-date-field">
          <input
            type="text"
            class="compact-date-input"
            name="${name}"
            value="${compactValue}"
            placeholder="YYYYMMDD"
            inputmode="numeric"
            maxlength="8"
            autocomplete="off"
          >
          <input
            type="date"
            class="date-picker-native"
            value="${isoValue}"
            tabindex="-1"
            aria-label="${label}"
          >
        </div>
      </label>
    `;
  };

  const renderActions = (presentation) => {
    if (!isAdmin) {
      return '<button type="button" data-action="view-props" data-domain="' + escapeHtml(presentation.domain) + '">查看属性</button>';
    }

    return [
      '<button type="button" data-action="query-whois" data-domain="' + escapeHtml(presentation.domain) + '">查询WHOIS</button>',
      '<button type="button" data-action="delete-domain" data-domain="' + escapeHtml(presentation.domain) + '">删除</button>',
      presentation.isCustom
        ? '<button type="button" data-action="reset-custom" data-domain="' + escapeHtml(presentation.domain) + '">重置为非自定义</button>'
        : ''
    ].join('');
  };

  const renderEditorRow = (presentation, colspan) => {
    return '';
  };

  const renderTopLevelRows = (domainList) => {
    if (!domainList.length) {
      return `<tr><td colspan="${isAdmin ? 9 : 8}" class="empty-cell">暂无域名</td></tr>`;
    }

    return domainList.map((info) => {
      const presentation = buildDomainPresentation(info);
      const daysRemainingText = Number.isFinite(presentation.daysRemaining) ? presentation.daysRemaining : 'N/A';
      const statusMeta = getStatusMeta(presentation.daysRemaining);
      const whoisError = (!hasCompleteWhoisData(presentation) && presentation.whoisError)
        ? `<div class="cell-note cell-error">WHOIS错误：${escapeHtml(presentation.whoisError)}</div>`
        : '';
      const sortAttrs = buildRowDataAttributes({
        status: statusMeta.rank,
        domain: presentation.domain,
        system: getDisplayValue(presentation.system),
        registrar: presentation.registrarText,
        registration: getComparableDateValue(presentation.parentRegistrationDateText),
        expiration: getComparableDateValue(presentation.parentExpirationDateText),
        days: Number.isFinite(presentation.daysRemaining) ? presentation.daysRemaining : 999999,
        progress: presentation.progressPercentage.toFixed(2)
      }, 'sort');
      const filterAttrs = buildRowDataAttributes({
        status: statusMeta.label.toLowerCase(),
        domain: String(presentation.domain || '').toLowerCase(),
        system: String(getDisplayValue(presentation.system) || '').toLowerCase(),
        registrar: String(presentation.registrarText || '').toLowerCase(),
        registration: String(toCompactDateString(presentation.parentRegistrationDateText) || '').toLowerCase(),
        expiration: String(toCompactDateString(presentation.parentExpirationDateText) || '').toLowerCase(),
        days: String(daysRemainingText).toLowerCase(),
        progress: String(presentation.progressPercentage.toFixed(2)).toLowerCase()
      }, 'filter');

      return `
        <tr class="data-row table-data-row${isAdmin ? ' admin-edit-row' : ''}" data-domain="${escapeHtml(presentation.domain)}" ${isAdmin ? 'data-nested="false"' : ''} ${sortAttrs} ${filterAttrs}>
          <td class="status-column">
            <span class="status-dot" style="background-color: ${getStatusColor(presentation.daysRemaining)};" title="${getStatusTitle(presentation.daysRemaining)}"></span>
          </td>
          <td class="domain-column">${escapeHtml(presentation.domain)}</td>
          <td class="system-column">${escapeHtml(getDisplayValue(presentation.system))}</td>
          <td class="registrar-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'registrar', value: presentation.registrarText, placeholder: '请输入注册商' })
              : escapeHtml(presentation.registrarText)}
            ${whoisError}
          </td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'registrationDate', value: presentation.parentRegistrationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.parentRegistrationDateText)}
          </td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'expirationDate', value: presentation.parentExpirationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.parentExpirationDateText)}
          </td>
          <td class="days-column">${daysRemainingText}</td>
          <td class="progress-column">${renderProgressBar(presentation.progressPercentage)}</td>
          ${isAdmin ? `<td class="operation-column">${renderActions(presentation)}</td>` : ''}
        </tr>
      `;
    }).join('');
  };

  const renderNestedRows = (domainList) => {
    if (!domainList.length) {
      return `<tr><td colspan="${isAdmin ? 13 : 12}" class="empty-cell">暂无域名</td></tr>`;
    }

    const presentations = domainList.map((info) => buildDomainPresentation(info));
    if (isAdmin) {
      presentations.sort((a, b) => {
        const parentCompare = String(a.parentDomainName || '').localeCompare(String(b.parentDomainName || ''));
        if (parentCompare !== 0) {
          return parentCompare;
        }
        return String(a.domain || '').localeCompare(String(b.domain || ''));
      });
    }

    let lastParentDomainName = '';

    return presentations.map((presentation) => {
      const daysRemainingText = Number.isFinite(presentation.daysRemaining) ? presentation.daysRemaining : 'N/A';
      const statusMeta = getStatusMeta(presentation.daysRemaining);
      const missingNote = presentation.missingSecondLevelDates
        ? '<div class="cell-note cell-warning">KV 未读到二级域名时间，请手动录入</div>'
        : '';
      const whoisError = (!hasCompleteWhoisData(presentation) && presentation.whoisError)
        ? `<div class="cell-note cell-error">WHOIS错误：${escapeHtml(presentation.whoisError)}</div>`
        : '';

      const sortAttrs = buildRowDataAttributes({
        status: statusMeta.rank,
        domain: presentation.domain,
        system: getDisplayValue(presentation.system),
        registrar: presentation.registrarText,
        parentDomain: presentation.parentDomainName,
        parentRegistration: getComparableDateValue(presentation.parentRegistrationDateText),
        parentExpiration: getComparableDateValue(presentation.parentExpirationDateText),
        secondRegistration: getComparableDateValue(presentation.secondLevelRegistrationDateText),
        secondExpiration: getComparableDateValue(presentation.secondLevelExpirationDateText),
        effectiveExpiration: getComparableDateValue(presentation.effectiveExpirationDateText),
        days: Number.isFinite(presentation.daysRemaining) ? presentation.daysRemaining : 999999,
        progress: presentation.progressPercentage.toFixed(2)
      }, 'sort');
      const filterAttrs = buildRowDataAttributes({
        status: statusMeta.label.toLowerCase(),
        domain: String(presentation.domain || '').toLowerCase(),
        system: String(getDisplayValue(presentation.system) || '').toLowerCase(),
        registrar: String(presentation.registrarText || '').toLowerCase(),
        parentDomain: String(presentation.parentDomainName || '').toLowerCase(),
        parentRegistration: String(toCompactDateString(presentation.parentRegistrationDateText) || '').toLowerCase(),
        parentExpiration: String(toCompactDateString(presentation.parentExpirationDateText) || '').toLowerCase(),
        secondRegistration: String(toCompactDateString(presentation.secondLevelRegistrationDateText) || '').toLowerCase(),
        secondExpiration: String(toCompactDateString(presentation.secondLevelExpirationDateText) || '').toLowerCase(),
        effectiveExpiration: String(toCompactDateString(presentation.effectiveExpirationDateText) || '').toLowerCase(),
        days: String(daysRemainingText).toLowerCase(),
        progress: String(presentation.progressPercentage.toFixed(2)).toLowerCase()
      }, 'filter');
      const shouldInsertGroupRow = isAdmin && presentation.parentDomainName !== lastParentDomainName;
      lastParentDomainName = presentation.parentDomainName;
      const groupRow = shouldInsertGroupRow
        ? `<tr class="group-row"><td colspan="${isAdmin ? 13 : 12}">后缀分组: ${escapeHtml(presentation.parentDomainName || 'Unknown')}</td></tr>`
        : '';

      return `
        ${groupRow}
        <tr class="data-row table-data-row${presentation.missingSecondLevelDates ? ' row-warning' : ''}${isAdmin ? ' admin-edit-row' : ''}" data-domain="${escapeHtml(presentation.domain)}" ${isAdmin ? 'data-nested="true"' : ''} ${sortAttrs} ${filterAttrs}>
          <td class="status-column">
            <span class="status-dot" style="background-color: ${getStatusColor(presentation.daysRemaining)};" title="${getStatusTitle(presentation.daysRemaining)}"></span>
          </td>
          <td class="domain-column">${escapeHtml(presentation.domain)}</td>
          <td class="system-column">${escapeHtml(getDisplayValue(presentation.system))}</td>
          <td class="registrar-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'registrar', value: presentation.registrarText, placeholder: '请输入注册商' })
              : escapeHtml(presentation.registrarText)}
            ${whoisError}
          </td>
          <td class="domain-column">${escapeHtml(presentation.parentDomainName)}</td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'parentRegistrationDate', value: presentation.parentRegistrationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.parentRegistrationDateText)}
          </td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'parentExpirationDate', value: presentation.parentExpirationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.parentExpirationDateText)}
          </td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'secondLevelRegistrationDate', value: presentation.secondLevelRegistrationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.secondLevelRegistrationDateText)}
            ${isAdmin ? (presentation.missingSecondLevelDates ? '<div class="cell-note cell-warning">KV 缺失，需手动录入</div>' : '') : missingNote}
          </td>
          <td class="date-column${isAdmin ? ' admin-input-cell' : ''}">
            ${isAdmin
              ? renderAdminInput({ name: 'secondLevelExpirationDate', value: presentation.secondLevelExpirationDateText, placeholder: '请输入YYYYMMDD', type: 'date' })
              : escapeHtml(presentation.secondLevelExpirationDateText)}
          </td>
          <td class="date-column">${escapeHtml(toCompactDateString(presentation.effectiveExpirationDateText) || presentation.effectiveExpirationDateText)}<div class="cell-note">${escapeHtml(presentation.effectiveSourceText)}</div></td>
          <td class="days-column">${daysRemainingText}</td>
          <td class="progress-column">${renderProgressBar(presentation.progressPercentage)}</td>
          ${isAdmin ? `<td class="operation-column">${renderActions(presentation)}</td>` : ''}
        </tr>
      `;
    }).join('');
  };

  const adminLink = isAdmin
    ? '<span class="pill current-mode">当前为后台管理</span><a class="pill link-pill" href="/">返回前台</a>'
    : '<span class="pill current-mode">当前为前台</span><a class="pill link-pill" href="/admin">进入后台管理</a>';

  const adminTools = isAdmin ? `
    <div class="toolbar">
      <button id="saveAllDomainsBtn" class="primary-btn">保存全部修改</button>
      <button id="updateAllWhoisBtn" class="primary-btn">全局更新WHOIS</button>
      <button id="syncCloudflareBtn" class="primary-btn">同步 Cloudflare 域名</button>
      <span id="saveStatus" class="toolbar-status"></span>
      <span id="whoisStatus" class="toolbar-status"></span>
      <span id="syncStatus" class="toolbar-status"></span>
    </div>
  ` : '';

  const addDomainPanel = isAdmin ? `
    <section class="editor-panel add-panel">
      <div class="panel-head">
        <h2>添加自定义域名</h2>
        <p>自定义域名可在这里直接录入；二级域名时间也支持手动补充。</p>
      </div>
      <form id="addCustomDomainForm" class="add-domain-form">
        <label class="editor-field">
          <span>域名</span>
          <input type="text" id="newDomain" placeholder="例如：sub.example.com" required>
        </label>
        <label class="editor-field">
          <span>系统</span>
          <input type="text" id="newSystem" placeholder="Cloudflare / Custom" required>
        </label>
        <label class="editor-field">
          <span>注册商</span>
          <input type="text" id="newRegistrar" placeholder="可选">
        </label>
        <label class="editor-field">
          <span>一级域名注册日期</span>
          <div class="compact-date-field">
            <input type="text" id="newRegistrationDate" class="compact-date-input" placeholder="YYYYMMDD" inputmode="numeric" maxlength="8" autocomplete="off">
            <input type="date" class="date-picker-native" tabindex="-1" aria-label="一级域名注册日期">
          </div>
        </label>
        <label class="editor-field">
          <span>一级域名到期时间</span>
          <div class="compact-date-field">
            <input type="text" id="newExpirationDate" class="compact-date-input" placeholder="YYYYMMDD" inputmode="numeric" maxlength="8" autocomplete="off">
            <input type="date" class="date-picker-native" tabindex="-1" aria-label="一级域名到期时间">
          </div>
        </label>
        <label class="editor-field">
          <span>二级域名注册日期</span>
          <div class="compact-date-field">
            <input type="text" id="newSecondLevelRegistrationDate" class="compact-date-input" placeholder="YYYYMMDD" inputmode="numeric" maxlength="8" autocomplete="off">
            <input type="date" class="date-picker-native" tabindex="-1" aria-label="二级域名注册日期">
          </div>
        </label>
        <label class="editor-field">
          <span>二级域名到期时间</span>
          <div class="compact-date-field">
            <input type="text" id="newSecondLevelExpirationDate" class="compact-date-input" placeholder="YYYYMMDD" inputmode="numeric" maxlength="8" autocomplete="off">
            <input type="date" class="date-picker-native" tabindex="-1" aria-label="二级域名到期时间">
          </div>
        </label>
        <div class="editor-actions">
          <button type="submit" class="primary-btn">添加</button>
        </div>
      </form>
    </section>
  ` : '';

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</title>
  <link rel="icon" href="/favicon.svg?v=${VERSION}" sizes="any" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico?v=${VERSION}" type="image/svg+xml">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 12px;
      background: linear-gradient(180deg, #eef4ff 0%, #f6f8fb 100%);
      color: #1f2937;
    }
    .container {
      width: calc(100vw - 24px);
      max-width: 1920px;
      margin: 0 auto;
      padding-bottom: 60px;
      box-sizing: border-box;
    }
    .admin-container {
      padding-right: 148px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 32px;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .subtext {
      color: #64748b;
      font-size: 14px;
    }
    .admin-link {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 18px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #dbe3ef;
      background: rgba(255,255,255,0.9);
      color: #334155;
      text-decoration: none;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    }
    .current-mode {
      font-weight: 600;
    }
    .link-pill {
      color: #2563eb;
    }
    .support-banner {
      margin-bottom: 18px;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.92);
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }
    .support-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #334155;
      font-size: 13px;
    }
    .support-copy span {
      color: #64748b;
    }
    .support-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .support-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 14px;
      border-radius: 999px;
      border: 1px solid #dbe3ef;
      background: #ffffff;
      color: #0f172a;
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }
    .github-btn {
      color: #111827;
    }
    .star-btn {
      background: #fef3c7;
      border-color: #facc15;
      color: #854d0e;
    }
    .donate-btn {
      background: #dcfce7;
      border-color: #86efac;
      color: #166534;
    }
    .toolbar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: fixed;
      top: 50%;
      right: 18px;
      transform: translateY(-50%);
      z-index: 900;
      width: 120px;
    }
    .toolbar-buttons,
    .toolbar-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toolbar .primary-btn {
      width: 100%;
      margin: 0;
      padding: 10px 8px;
      line-height: 1.35;
      border-radius: 14px;
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.18);
    }
    .toolbar-status {
      display: block;
      min-height: 18px;
      padding: 8px 10px;
      color: #475569;
      font-size: 12px;
      line-height: 1.45;
      background: rgba(255,255,255,0.92);
      border: 1px solid #dbe3ef;
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    }
    .toolbar-status:empty {
      display: none;
    }
    .panel,
    .editor-panel,
    .modal-card {
      position: relative;
      background: rgba(255,255,255,0.92);
      border: 1px solid #dbe3ef;
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      overflow: hidden;
      transition: margin-bottom 0.16s ease;
    }
    .panel:has(.sortable-header.menu-open) {
      overflow: visible;
      z-index: 8;
    }
    .panel + .panel,
    .panel + .editor-panel,
    .editor-panel + .panel {
      margin-top: 18px;
    }
    .panel-head {
      padding: 16px 16px 10px;
    }
    .panel-head h2 {
      margin: 0;
      font-size: 22px;
    }
    .panel-head p {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 14px;
    }
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
      font-size: 13px;
    }
    thead th {
      position: sticky;
      top: 0;
      background: #f8fafc;
      z-index: 1;
      font-size: 13px;
      color: #475569;
    }
    .data-row:hover {
      background: rgba(248, 250, 252, 0.8);
    }
    .row-warning {
      background: rgba(255, 247, 237, 0.65);
    }
    .status-column {
      width: 62px;
      min-width: 62px;
    }
    .domain-column {
      min-width: 120px;
      max-width: 180px;
      word-break: break-all;
      white-space: normal;
    }
    .system-column,
    .registrar-column {
      min-width: 90px;
    }
    .registrar-column {
      white-space: normal;
      min-width: 130px;
      max-width: 180px;
    }
    .date-column {
      min-width: 96px;
    }
    .days-column {
      min-width: 58px;
    }
    .progress-column {
      min-width: 110px;
    }
    .operation-column {
      min-width: 260px;
      white-space: normal;
    }
    .nested-table .domain-column {
      min-width: 106px;
      max-width: 150px;
    }
    .js-interactive-table .domain-column {
      min-width: 130px;
      max-width: none;
      word-break: normal;
      white-space: nowrap;
    }
    .nested-table .registrar-column {
      min-width: 110px;
      max-width: 150px;
    }
    .nested-table .date-column {
      min-width: 84px;
    }
    .nested-table .progress-column {
      min-width: 90px;
    }
    .sortable-header {
      vertical-align: top;
      overflow: visible;
    }
    .header-cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .header-text {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
    }
    .header-title {
      font-weight: 600;
      line-height: 1.35;
      white-space: nowrap;
    }
    .header-state {
      font-size: 11px;
      line-height: 1.2;
      color: #2563eb;
      font-weight: 700;
    }
    .header-sort-buttons {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .header-sort-buttons .sort-btn {
      width: 20px;
      min-width: 20px;
      height: 20px;
      padding: 0;
      margin: 0;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      background: #fff;
    }
    .header-sort-buttons .sort-btn.is-active {
      color: #2563eb;
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .filter-row th {
      position: sticky;
      top: 40px;
      background: #f8fafc;
      z-index: 1;
      padding: 4px 6px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .filter-cell {
      min-height: 28px;
    }
    .column-filter {
      width: 100%;
      min-width: 56px;
      box-sizing: border-box;
      border: 1px solid #d0d7e2;
      border-radius: 10px;
      padding: 8px 34px 8px 10px;
      font-size: 12px;
      background: #fff;
      color: #111827;
      margin: 0;
    }
    .column-filter-select,
    .column-range-input {
      width: 100%;
      min-width: 56px;
      box-sizing: border-box;
      border: 1px solid #d0d7e2;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      background: #fff;
      color: #111827;
      margin: 0;
    }
    .filter-row .column-filter-wrap,
    .filter-row .column-filter-select,
    .filter-row .column-range-stack {
      width: 100%;
    }
    .filter-row .column-filter,
    .filter-row .column-filter-select,
    .filter-row .column-range-input {
      min-width: 0;
      font-size: 11px;
      padding: 5px 7px;
      border-radius: 8px;
    }
    .filter-row .column-filter {
      padding-right: 24px;
    }
    .filter-row .column-range-stack {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
    }
    .filter-row .column-range-label {
      display: none;
    }
    .filter-row .filter-placeholder {
      min-height: 28px;
    }
    .filter-row .filter-clear-btn {
      right: 6px;
      width: 16px;
      height: 16px;
      min-width: 16px;
      font-size: 11px;
    }
    .column-range-stack {
      display: grid;
      gap: 8px;
    }
    .column-range-field {
      display: grid;
      gap: 4px;
    }
    .column-range-label {
      font-size: 11px;
      line-height: 1.2;
      color: #64748b;
    }
    .column-filter-wrap {
      position: relative;
    }
    .filter-clear-btn {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      min-width: 18px;
      padding: 0;
      margin: 0;
      border-radius: 999px;
      font-size: 12px;
      line-height: 1;
      display: none;
      align-items: center;
      justify-content: center;
      color: #64748b;
      background: #f8fafc;
    }
    .filter-clear-btn.is-visible {
      display: inline-flex;
    }
    .group-row td {
      padding: 10px 12px;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
      border-top: 1px solid #dbeafe;
      border-bottom: 1px solid #dbeafe;
    }
    .status-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 5px;
    }
    .progress-bar {
      width: 100%;
      min-width: 80px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress {
      height: 10px;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
    }
    button {
      appearance: none;
      border: 1px solid #d0d7e2;
      background: #fff;
      color: #111827;
      border-radius: 10px;
      padding: 6px 10px;
      cursor: pointer;
      margin: 2px;
    }
    .primary-btn {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    .cell-note {
      margin-top: 4px;
      color: #64748b;
      font-size: 11px;
      line-height: 1.35;
      white-space: normal;
    }
    .cell-warning {
      color: #b45309;
    }
    .cell-error {
      color: #b91c1c;
    }
    .admin-input-cell {
      min-width: 150px;
    }
    .admin-inline-input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      background: #fff;
      color: #0f172a;
      font-size: 13px;
      line-height: 1.3;
    }
    .admin-date-input {
      letter-spacing: 0.06em;
    }
    .admin-inline-input.is-missing {
      border-color: #ef4444;
      background: #fef2f2;
      color: #b91c1c;
    }
    .admin-inline-input.is-invalid {
      border-color: #dc2626;
      background: #fff1f2;
      color: #991b1b;
    }
    .editor-row {
      display: none;
      background: #f8fafc;
    }
    .editor-row.is-open {
      display: table-row;
    }
    .editor-row td {
      padding: 14px 16px;
    }
    .editor-help {
      margin-bottom: 12px;
      font-size: 13px;
      color: #475569;
    }
    .editor-help-warning {
      color: #b45309;
    }
    .editor-grid,
    .add-domain-form {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
    }
    .editor-grid-simple {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .editor-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      color: #334155;
    }
    .editor-field input {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      background: #fff;
      font-size: 14px;
    }
    .compact-date-field {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .compact-date-input {
      flex: 1;
      min-width: 0;
      letter-spacing: 0.06em;
    }
    .date-picker-native {
      width: 42px;
      min-width: 42px;
      padding: 10px 6px;
      color: transparent;
      caret-color: transparent;
      overflow: hidden;
    }
    .date-picker-native::-webkit-datetime-edit,
    .date-picker-native::-webkit-clear-button,
    .date-picker-native::-webkit-inner-spin-button {
      display: none;
    }
    .date-picker-native::-webkit-calendar-picker-indicator {
      opacity: 1;
      cursor: pointer;
      margin: 0;
      width: 18px;
      height: 18px;
    }
    .editor-actions {
      margin-top: 12px;
    }
    .add-panel {
      margin-top: 18px;
      padding: 0 20px 20px;
    }
    .add-domain-form {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      padding-top: 12px;
    }
    .empty-cell {
      text-align: center;
      color: #64748b;
      padding: 20px;
    }
    .filter-empty-row .empty-cell {
      padding: 28px 20px;
      color: #475569;
      background: rgba(248, 250, 252, 0.9);
      font-weight: 600;
    }
    .domain-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.4);
    }
    .domain-modal-content {
      background: #fff;
      margin: 8% auto;
      padding: 24px;
      border: 1px solid #dbe3ef;
      width: min(720px, calc(100% - 24px));
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    }
    .domain-modal-close {
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      line-height: 1;
      color: #94a3b8;
    }
    .loading-overlay {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.35);
      z-index: 1200;
      backdrop-filter: blur(2px);
    }
    .loading-overlay.is-visible {
      display: flex;
    }
    .loading-card {
      min-width: 220px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 22px 24px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    }
    .loading-spinner {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 3px solid #dbeafe;
      border-top-color: #2563eb;
      animation: loading-spin 0.9s linear infinite;
    }
    .loading-message {
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
    }
    .whois-result-panel {
      margin-top: 18px;
    }
    .whois-result-body {
      padding: 0 16px 16px;
    }
    .whois-result-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .whois-meta-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 600;
    }
    .whois-result-grid {
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    .whois-trace-block,
    .whois-raw-block {
      min-width: 0;
    }
    .whois-trace-block h3,
    .whois-raw-block h3 {
      margin: 0 0 10px;
      font-size: 15px;
      color: #0f172a;
    }
    .whois-trace-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .whois-trace-item {
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid #dbe3ef;
      background: #f8fafc;
    }
    .whois-trace-item.is-success {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .whois-trace-item.is-failed {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .whois-trace-item.is-incomplete {
      background: #fff7ed;
      border-color: #fed7aa;
    }
    .whois-trace-title {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .whois-trace-message {
      font-size: 12px;
      line-height: 1.5;
      color: #475569;
      white-space: normal;
      word-break: break-word;
    }
    .whois-raw-data {
      margin: 0;
      padding: 14px;
      min-height: 260px;
      max-height: 720px;
      overflow: auto;
      border-radius: 16px;
      border: 1px solid #dbe3ef;
      background: #f8fafc;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Consolas, Monaco, monospace;
    }
    @keyframes loading-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .domain-property {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .domain-property-label {
      color: #64748b;
      flex-shrink: 0;
    }
    .domain-property-value {
      text-align: right;
      word-break: break-all;
      font-weight: 600;
    }
    @media (max-width: 900px) {
      body {
        padding: 14px;
      }
      .container {
        width: 100%;
        max-width: none;
      }
      .admin-container {
        padding-right: 0;
      }
      .toolbar {
        position: static;
        transform: none;
        width: auto;
        margin: 0 0 18px;
      }
      .toolbar-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .whois-result-grid {
        grid-template-columns: 1fr;
      }
      .editor-grid,
      .editor-grid-simple,
      .add-domain-form {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 640px) {
      h1 {
        font-size: 28px;
      }
      .topbar {
        flex-direction: column;
        align-items: flex-start;
      }
      .support-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .support-actions {
        justify-content: flex-start;
      }
      .admin-link {
        align-items: flex-start;
      }
      .toolbar-buttons {
        grid-template-columns: 1fr;
      }
      .editor-grid,
      .editor-grid-simple,
      .add-domain-form {
        grid-template-columns: 1fr;
      }
      .domain-property {
        flex-direction: column;
        gap: 6px;
      }
      .domain-property-value {
        text-align: left;
      }
    }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="topbar">
        <div>
          <h1>${CUSTOM_TITLE}${isAdmin ? ' - 后台管理' : ''}</h1>
          <div class="subtext">保持表格视图，优先一页内完成域名状态巡检。</div>
        </div>
      </div>
      <div class="admin-link">${adminLink}</div>
      ${renderSupportBanner()}
      ${adminTools}

      <section class="panel">
        <div class="panel-head">
          <h2>CF 顶级域名</h2>
          <p>直接展示 Cloudflare 账户下的顶级域名。</p>
        </div>
        <div class="table-wrapper">
          <table class="domain-table top-table${isAdmin ? '' : ' js-interactive-table'}">
            <thead>
              <tr>
                <th class="status-column">状态</th>
                <th class="domain-column">域名</th>
                <th class="system-column">系统</th>
                <th class="registrar-column">注册商</th>
                <th class="date-column">注册日期</th>
                <th class="date-column">到期时间</th>
                <th class="days-column">剩余天数</th>
                <th class="progress-column">进度</th>
                ${isAdmin ? '<th class="operation-column">操作</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${renderTopLevelRows(categorizedDomains.cfTopLevel)}
            </tbody>
          </table>
        </div>
      </section>

      ${isAdmin ? `
        <section class="panel">
          <div class="panel-head">
            <h2>CF 二级域名 / 自定义域名</h2>
            <p>同时展示一级域名和二级域名的注册日期、到期时间。二级域名时间优先从 KV 读取，没有就可直接补录。</p>
          </div>
          <div class="table-wrapper">
            <table class="domain-table nested-table">
              <thead>
                <tr>
                  <th class="status-column">状态</th>
                  <th class="domain-column">域名</th>
                  <th class="system-column">系统</th>
                  <th class="registrar-column">注册商</th>
                  <th class="domain-column">一级域名</th>
                  <th class="date-column">一级注册日期</th>
                  <th class="date-column">一级到期时间</th>
                  <th class="date-column">二级注册日期</th>
                  <th class="date-column">二级到期时间</th>
                  <th class="date-column">当前监控到期</th>
                  <th class="days-column">剩余天数</th>
                  <th class="progress-column">进度</th>
                  <th class="operation-column">操作</th>
                </tr>
              </thead>
              <tbody>
                ${renderNestedRows(categorizedDomains.cfSecondLevelAndCustom)}
              </tbody>
            </table>
          </div>
        </section>
      ` : `
        <section class="panel">
          <div class="panel-head">
            <h2>CF 二级域名</h2>
            <p>展示 Cloudflare 二级域名的一级域名和二级域名注册日期、到期时间。</p>
          </div>
          <div class="table-wrapper">
            <table class="domain-table nested-table js-interactive-table">
              <thead>
                <tr>
                  <th class="status-column">状态</th>
                  <th class="domain-column">域名</th>
                  <th class="system-column">系统</th>
                  <th class="registrar-column">注册商</th>
                  <th class="domain-column">一级域名</th>
                  <th class="date-column">一级注册日期</th>
                  <th class="date-column">一级到期时间</th>
                  <th class="date-column">二级注册日期</th>
                  <th class="date-column">二级到期时间</th>
                  <th class="date-column">当前监控到期</th>
                  <th class="days-column">剩余天数</th>
                  <th class="progress-column">进度</th>
                </tr>
              </thead>
              <tbody>
                ${renderNestedRows(categorizedDomains.cfSecondLevel)}
              </tbody>
            </table>
          </div>
        </section>
        ${categorizedDomains.customDomains.length ? `
          <section class="panel">
            <div class="panel-head">
              <h2>自定义域名</h2>
              <p>只展示手动添加的自定义域名；没有自定义域名时该板块会自动隐藏。</p>
            </div>
            <div class="table-wrapper">
              <table class="domain-table nested-table js-interactive-table">
                <thead>
                  <tr>
                    <th class="status-column">状态</th>
                    <th class="domain-column">域名</th>
                    <th class="system-column">系统</th>
                    <th class="registrar-column">注册商</th>
                    <th class="domain-column">一级域名</th>
                    <th class="date-column">一级注册日期</th>
                    <th class="date-column">一级到期时间</th>
                    <th class="date-column">二级注册日期</th>
                    <th class="date-column">二级到期时间</th>
                    <th class="date-column">当前监控到期</th>
                    <th class="days-column">剩余天数</th>
                    <th class="progress-column">进度</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderNestedRows(categorizedDomains.customDomains)}
                </tbody>
              </table>
            </div>
          </section>
        ` : ''}
      `}

      ${addDomainPanel}

      ${isAdmin ? `
        <section id="whoisResultPanel" class="panel whois-result-panel" hidden>
          <div class="panel-head">
            <h2>WHOIS 查询结果</h2>
            <p id="whoisResultSummary">这里会显示查询链路、最终来源和格式化后的完整 WHOIS。</p>
          </div>
          <div class="whois-result-body">
            <div id="whoisResultMeta" class="whois-result-meta"></div>
            <div class="whois-result-grid">
              <div class="whois-trace-block">
                <h3>查询过程</h3>
                <div id="whoisTraceList" class="whois-trace-list"></div>
              </div>
              <div class="whois-raw-block">
                <h3>完整 WHOIS</h3>
                <pre id="whoisRawData" class="whois-raw-data"></pre>
              </div>
            </div>
          </div>
        </section>
      ` : ''}
    </div>

    <div id="domainPropsModal" class="domain-modal">
      <div class="domain-modal-content">
        <span class="domain-modal-close">&times;</span>
        <h2>域名属性</h2>
        <div id="domainPropsContent"></div>
      </div>
    </div>

    <div id="loadingOverlay" class="loading-overlay" aria-hidden="true">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <div id="loadingMessage" class="loading-message">加载中...</div>
      </div>
    </div>

    <script>
    const adminAuthHeader = 'Basic ' + btoa(':${ADMIN_PASSWORD}');

    function createPropertyHTML(label, value) {
      return '<div class="domain-property">' +
        '<span class="domain-property-label">' + label + '</span>' +
        '<span class="domain-property-value">' + (value || 'Unknown') + '</span>' +
        '</div>';
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    const whoisResultPanel = document.getElementById('whoisResultPanel');
    const whoisResultSummary = document.getElementById('whoisResultSummary');
    const whoisResultMeta = document.getElementById('whoisResultMeta');
    const whoisTraceList = document.getElementById('whoisTraceList');
    const whoisRawData = document.getElementById('whoisRawData');
    let loadingCounter = 0;

    function showLoading(message) {
      loadingCounter += 1;
      if (loadingMessage) {
        loadingMessage.textContent = message || '加载中...';
      }
      if (loadingOverlay) {
        loadingOverlay.classList.add('is-visible');
        loadingOverlay.setAttribute('aria-hidden', 'false');
      }
    }

    function hideLoading() {
      loadingCounter = Math.max(0, loadingCounter - 1);
      if (loadingCounter > 0) {
        return;
      }
      if (loadingOverlay) {
        loadingOverlay.classList.remove('is-visible');
        loadingOverlay.setAttribute('aria-hidden', 'true');
      }
    }

    async function withLoading(message, task) {
      showLoading(message);
      try {
        return await task();
      } finally {
        hideLoading();
      }
    }

    function escapeClientHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderWhoisResult(data, domain) {
      if (!whoisResultPanel || !whoisResultSummary || !whoisResultMeta || !whoisTraceList || !whoisRawData) {
        return;
      }

      const safeData = data || {};
      const parsed = safeData.parsed || {};
      const traceItems = Array.isArray(safeData.trace) ? safeData.trace : [];
      const source = safeData.source || 'unknown';
      const lookupDomain = safeData.lookupDomain || domain;

      whoisResultPanel.hidden = false;
      whoisResultSummary.textContent = safeData.error
        ? ('查询失败：' + (safeData.message || '未知错误'))
        : ('查询域名：' + domain + '；最终展示来源：' + source + '；实际查询域名：' + lookupDomain);

      const chips = [];
      chips.push('<span class="whois-meta-chip">最终来源：' + escapeClientHtml(source) + '</span>');
      chips.push('<span class="whois-meta-chip">实际查询域名：' + escapeClientHtml(lookupDomain) + '</span>');
      if (parsed.registrar) {
        chips.push('<span class="whois-meta-chip">注册商：' + escapeClientHtml(parsed.registrar) + '</span>');
      }
      if (parsed.registrationDate) {
        chips.push('<span class="whois-meta-chip">注册时间：' + escapeClientHtml(parsed.registrationDate) + '</span>');
      }
      if (parsed.expirationDate) {
        chips.push('<span class="whois-meta-chip">到期时间：' + escapeClientHtml(parsed.expirationDate) + '</span>');
      }
      whoisResultMeta.innerHTML = chips.join('');

      whoisTraceList.innerHTML = traceItems.length
        ? traceItems.map(function(item, index) {
            const stateClass = item.status === 'success' ? 'is-success' : (item.status === 'failed' ? 'is-failed' : 'is-incomplete');
            return '<div class="whois-trace-item ' + stateClass + '">' +
              '<div class="whois-trace-title">' +
                '<span>步骤 ' + (index + 1) + ' · ' + escapeClientHtml(item.source || 'unknown') + '</span>' +
                '<span>' + escapeClientHtml(item.lookupDomain || domain) + '</span>' +
              '</div>' +
              '<div class="whois-trace-message">' + escapeClientHtml(item.message || '') + '</div>' +
            '</div>';
          }).join('')
        : '<div class="whois-trace-item"><div class="whois-trace-message">没有可展示的查询过程。</div></div>';

      whoisRawData.textContent = safeData.rawData || safeData.message || '';
      whoisResultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function normalizeCompactDateInputValue(value) {
      return String(value || '').replace(/\\D/g, '').slice(0, 8);
    }

    function compactDateToStorageValue(value) {
      const digits = normalizeCompactDateInputValue(value);
      if (digits.length !== 8) {
        return '';
      }

      return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8);
    }

    function storageDateToCompactValue(value) {
      return String(value || '').replace(/\\D/g, '').slice(0, 8);
    }

    function syncCompactDateField(field) {
      if (!field) {
        return;
      }

      const textInput = field.querySelector('.compact-date-input');
      const pickerInput = field.querySelector('.date-picker-native');
      if (!textInput || !pickerInput) {
        return;
      }

      const digits = normalizeCompactDateInputValue(textInput.value);
      textInput.value = digits;
      pickerInput.value = compactDateToStorageValue(digits);
    }

    function initializeCompactDateFields(root = document) {
      root.querySelectorAll('.compact-date-field').forEach(function(field) {
        syncCompactDateField(field);
      });
    }

    function normalizeAdminFieldValue(input) {
      if (!input) {
        return '';
      }

      if (input.classList.contains('admin-date-input')) {
        input.value = normalizeCompactDateInputValue(input.value);
      } else {
        input.value = String(input.value || '').trim();
      }

      return input.value;
    }

    function updateAdminFieldState(input) {
      const value = normalizeAdminFieldValue(input);
      input.classList.toggle('is-missing', !value);
      input.classList.toggle('is-invalid', Boolean(value) && input.classList.contains('admin-date-input') && value.length !== 8);
      return value;
    }

    function collectAdminRowPayload(row) {
      if (!row) {
        return null;
      }

      const domain = row.dataset.domain;
      const isNested = row.dataset.nested === 'true';
      const inputs = Array.from(row.querySelectorAll('.admin-inline-input'));
      const values = {};
      let hasChanges = false;

      for (const input of inputs) {
        const currentValue = updateAdminFieldState(input);
        const initialValue = input.dataset.initialValue || '';
        if (input.classList.contains('admin-date-input') && currentValue && currentValue.length !== 8) {
          input.focus();
          throw new Error(domain + ' 的日期需要是 8 位，例如 20160415');
        }
        values[input.name] = currentValue;
        if (currentValue !== initialValue) {
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return null;
      }

      const payload = {
        domain,
        registrar: values.registrar || ''
      };

      if (isNested) {
        payload.parentRegistrationDate = compactDateToStorageValue(values.parentRegistrationDate || '');
        payload.parentExpirationDate = compactDateToStorageValue(values.parentExpirationDate || '');
        payload.secondLevelRegistrationDate = compactDateToStorageValue(values.secondLevelRegistrationDate || '');
        payload.secondLevelExpirationDate = compactDateToStorageValue(values.secondLevelExpirationDate || '');
        payload.registrationDate = payload.parentRegistrationDate;
        payload.expirationDate = payload.parentExpirationDate;
      } else {
        payload.registrationDate = compactDateToStorageValue(values.registrationDate || '');
        payload.expirationDate = compactDateToStorageValue(values.expirationDate || '');
      }

      return payload;
    }

    async function saveAllDomains() {
      const statusEl = document.getElementById('saveStatus');
      const saveButton = document.getElementById('saveAllDomainsBtn');
      const rows = Array.from(document.querySelectorAll('.admin-edit-row'));
      let payloads;

      try {
        payloads = rows.map(collectAdminRowPayload).filter(Boolean);
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message;
        }
        alert(error.message);
        return;
      }

      if (!payloads.length) {
        if (statusEl) {
          statusEl.textContent = '没有需要保存的修改';
        }
        return;
      }

      if (saveButton) {
        saveButton.disabled = true;
      }
      if (statusEl) {
        statusEl.textContent = '正在保存...';
      }

      try {
        await withLoading('正在保存全部修改...', async function() {
          for (let index = 0; index < payloads.length; index += 1) {
            const response = await fetch('/api/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': adminAuthHeader
              },
              body: JSON.stringify(payloads[index])
            });

            if (!response.ok) {
              throw new Error(payloads[index].domain + ' 保存失败');
            }

            if (statusEl) {
              statusEl.textContent = '正在保存 ' + (index + 1) + ' / ' + payloads.length;
            }
          }
        });

        if (statusEl) {
          statusEl.textContent = '保存成功';
        }
        location.reload();
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message;
        }
        alert(error.message);
      } finally {
        if (saveButton) {
          saveButton.disabled = false;
        }
      }
    }

    async function deleteDomain(domain) {
      const isCFTopLevel = domain.split('.').length === 2;
      let confirmMessage = '确定要删除这个域名吗？';
      if (isCFTopLevel) {
        confirmMessage = '注意：这将只从列表中删除此域名的记录，不会从 Cloudflare 中删除域名。下次同步时可能重新获取。确定继续吗？';
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      try {
        await withLoading('正在删除 ' + domain + ' ...', async function() {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': adminAuthHeader
            },
            body: JSON.stringify({
              action: 'delete',
              domain
            })
          });

          if (!response.ok) {
            throw new Error('删除失败');
          }
        });

        alert('删除成功');
        location.reload();
      } catch (error) {
        alert('删除失败: ' + error.message);
      }
    }

    async function updateAllWhois() {
      const statusEl = document.getElementById('whoisStatus');
      const button = document.getElementById('updateAllWhoisBtn');
      const domains = Array.from(document.querySelectorAll('.admin-edit-row'))
        .map(function(row) { return row.dataset.domain; })
        .filter(Boolean);

      if (!domains.length) {
        if (statusEl) {
          statusEl.textContent = '没有可更新的域名';
        }
        return;
      }

      if (!confirm('确定要全局更新 WHOIS 吗？这会逐个刷新当前列表中的域名缓存。')) {
        return;
      }

      if (button) {
        button.disabled = true;
      }
      if (statusEl) {
        statusEl.textContent = '正在更新WHOIS...';
      }

      try {
        await withLoading('正在全局更新 WHOIS...', async function() {
          for (let index = 0; index < domains.length; index += 1) {
            const response = await fetch('/api/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': adminAuthHeader
              },
              body: JSON.stringify({
                action: 'update-whois',
                domain: domains[index]
              })
            });

            if (!response.ok) {
              throw new Error(domains[index] + ' 的 WHOIS 更新失败');
            }

            if (statusEl) {
              statusEl.textContent = '正在更新 WHOIS ' + (index + 1) + ' / ' + domains.length;
            }
          }
        });

        if (statusEl) {
          statusEl.textContent = 'WHOIS 更新成功';
        }
        location.reload();
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message;
        }
        alert(error.message);
      } finally {
        if (button) {
          button.disabled = false;
        }
      }
    }

    async function queryWhoisInfo(domain) {
      try {
        const data = await withLoading('正在查询 ' + domain + ' 的 WHOIS...', async function() {
          const response = await fetch('/whois/' + domain);
          return await response.json();
        });

        renderWhoisResult(data, domain);
      } catch (error) {
        renderWhoisResult({
          error: true,
          message: error.message,
          trace: [],
          rawData: ''
        }, domain);
      }
    }

    async function viewDomainProps(domain) {
      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify({
            action: 'get-props',
            domain
          })
        });

        if (!response.ok) {
          throw new Error('获取属性失败');
        }

        const result = await response.json();
        if (!result.success || !result.props) {
          throw new Error(result.message || '获取属性失败');
        }

        const props = result.props;
        let content = '';
        content += createPropertyHTML('域名', domain);
        content += createPropertyHTML('自定义域名', props.isCustom ? '是' : '否');
        content += createPropertyHTML('系统', props.system || 'Unknown');
        content += createPropertyHTML('注册商', props.registrar || 'Unknown');
        content += createPropertyHTML('一级域名注册日期', props.parentRegistrationDate || props.registrationDate || 'Unknown');
        content += createPropertyHTML('一级域名到期时间', props.parentExpirationDate || props.expirationDate || 'Unknown');
        content += createPropertyHTML('二级域名注册日期', props.secondLevelRegistrationDate || 'Unknown');
        content += createPropertyHTML('二级域名到期时间', props.secondLevelExpirationDate || 'Unknown');
        content += createPropertyHTML('WHOIS 实际查询域名', props.whoisLookupDomain || 'Unknown');

        document.getElementById('domainPropsContent').innerHTML = content;
        document.getElementById('domainPropsModal').style.display = 'block';
      } catch (error) {
        alert('获取属性失败: ' + error.message);
      }
    }

    document.addEventListener('click', function(event) {
      const action = event.target.dataset.action;
      if (!action) {
        return;
      }

      const domain = event.target.dataset.domain;
      if (action === 'query-whois') {
        queryWhoisInfo(domain);
      } else if (action === 'reset-custom') {
        resetCustomFlag(domain);
      } else if (action === 'delete-domain') {
        deleteDomain(domain);
      }
    });

    document.addEventListener('input', function(event) {
      if (event.target.classList.contains('admin-inline-input')) {
        updateAdminFieldState(event.target);
      }

      if (event.target.classList.contains('compact-date-input')) {
        syncCompactDateField(event.target.closest('.compact-date-field'));
      }
    });

    document.addEventListener('change', function(event) {
      if (event.target.classList.contains('date-picker-native')) {
        const field = event.target.closest('.compact-date-field');
        const textInput = field ? field.querySelector('.compact-date-input') : null;
        if (!textInput) {
          return;
        }

        textInput.value = storageDateToCompactValue(event.target.value);
        syncCompactDateField(field);
      }
    });

    document.addEventListener('click', function(event) {
      const sortButton = event.target.closest('.sort-btn');
      if (!sortButton) {
        return;
      }

      const table = sortButton.closest('.js-interactive-table');
      if (!table) {
        return;
      }

      const state = getInteractiveTableState(table);
      const direction = sortButton.dataset.sortButton;
      const columnKey = sortButton.dataset.columnKey;

      if (state.sortKey === columnKey && state.sortDirection === direction) {
        state.sortKey = 'days';
        state.sortDirection = 'asc';
      } else {
        state.sortKey = columnKey;
        state.sortDirection = direction;
      }

      refreshInteractiveTable(table);
      closeColumnMenus();
    });

    document.addEventListener('input', function(event) {
      const filterInput = event.target.closest('.column-filter');
      if (!filterInput) {
        return;
      }

      const table = filterInput.closest('.js-interactive-table');
      if (!table) {
        return;
      }

      const state = getInteractiveTableState(table);
      state.filters[filterInput.dataset.columnKey] = filterInput.value || '';
      refreshInteractiveTable(table);
    });

    document.addEventListener('click', function(event) {
      const menuTrigger = event.target.closest('.column-menu-trigger');
      if (menuTrigger) {
        const headerCell = menuTrigger.closest('.sortable-header');
        const shouldOpen = headerCell && !headerCell.classList.contains('menu-open');
        closeColumnMenus();
        if (headerCell && shouldOpen) {
          headerCell.classList.add('menu-open');
          const table = headerCell.closest('.js-interactive-table');
          if (table) {
            syncTableWrapperMenuSpacing(table);
          }
          const filterInput = headerCell.querySelector('.column-filter');
          if (filterInput) {
            setTimeout(function() {
              filterInput.focus();
              filterInput.select();
            }, 0);
          }
        }
        return;
      }

      const clearFilterButton = event.target.closest('[data-filter-clear-button]');
      if (clearFilterButton) {
        const table = clearFilterButton.closest('.js-interactive-table');
        if (!table) {
          return;
        }

        const columnKey = clearFilterButton.dataset.filterClearButton;
        const state = getInteractiveTableState(table);
        state.filters[columnKey] = '';
        refreshInteractiveTable(table);
        const headerCell = clearFilterButton.closest('.sortable-header');
        const filterInput = headerCell ? headerCell.querySelector('.column-filter') : null;
        if (filterInput) {
          filterInput.focus();
        }
        return;
      }

      if (!event.target.closest('.column-menu')) {
        closeColumnMenus();
      }
    });

    const interactiveTableConfigs = {
      top: ${JSON.stringify(topLevelColumns)},
      nested: ${JSON.stringify(nestedColumns)}
    };

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-title">' + column.label + '</div>' +
          '<div class="header-sort-buttons">' +
            '<button type="button" class="sort-btn" data-sort-button="asc" data-column-key="' + column.key + '">升</button>' +
            '<button type="button" class="sort-btn" data-sort-button="desc" data-column-key="' + column.key + '">降</button>' +
            '<button type="button" class="sort-btn" data-sort-button="clear" data-column-key="' + column.key + '">清</button>' +
          '</div>';
      });

      const filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      filterRow.innerHTML = columns.map(function(column) {
        return '<th class="' + column.className + '">' +
          '<input type="text" class="column-filter" data-column-key="' + column.key + '" placeholder="筛选" autocomplete="off">' +
        '</th>';
      }).join('');
      headerRow.parentNode.appendChild(filterRow);

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function getInteractiveTableState(table) {
      if (!table._interactiveState) {
        table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
      }
      return table._interactiveState;
    }

    function getTableColumns(table) {
      if (table.classList.contains('nested-table')) {
        return interactiveTableConfigs.nested;
      }
      return interactiveTableConfigs.top;
    }

    function normalizeSortValue(value, sortType) {
      if (sortType === 'number' || sortType === 'date') {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
      }
      return String(value || '').toLowerCase();
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sort-btn').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    function refreshInteractiveTable(table) {
      if (!table || !table.classList.contains('js-interactive-table')) {
        return;
      }

      const columns = getTableColumns(table);
      const state = getInteractiveTableState(table);
      const tbody = table.tBodies[0];
      if (!tbody) {
        return;
      }

      const allRows = Array.from(tbody.querySelectorAll('tr.table-data-row'));
      const visibleRows = allRows.filter(function(row) {
        return columns.every(function(column) {
          const filterValue = String(state.filters[column.key] || '').trim().toLowerCase();
          if (!filterValue) {
            return true;
          }

          const rowValue = String(row.getAttribute('data-filter-' + column.key) || '').toLowerCase();
          return rowValue.includes(filterValue);
        });
      });

      const sortColumn = columns.find(function(column) {
        return column.key === state.sortKey;
      });

      if (sortColumn && state.sortDirection) {
        visibleRows.sort(function(a, b) {
          const aValue = normalizeSortValue(a.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          const bValue = normalizeSortValue(b.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          if (aValue === bValue) {
            const domainA = String(a.getAttribute('data-sort-domain') || '').toLowerCase();
            const domainB = String(b.getAttribute('data-sort-domain') || '').toLowerCase();
            return state.sortDirection === 'desc'
              ? domainB.localeCompare(domainA)
              : domainA.localeCompare(domainB);
          }
          return state.sortDirection === 'desc'
            ? (aValue < bValue ? 1 : -1)
            : (aValue > bValue ? 1 : -1);
        });
      }

      const hiddenRows = allRows.filter(function(row) {
        return !visibleRows.includes(row);
      });
      const fragment = document.createDocumentFragment();

      visibleRows.forEach(function(row) {
        row.style.display = '';
        fragment.appendChild(row);
      });
      hiddenRows.forEach(function(row) {
        row.style.display = 'none';
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      updateSortButtons(table, state);
    }

    function initializeInteractiveTables() {
      document.querySelectorAll('.js-interactive-table').forEach(function(table) {
        enhanceInteractiveTable(table, getTableColumns(table));
        refreshInteractiveTable(table);
      });
    }

    function closeColumnMenus(exceptHeaderCell) {
      document.querySelectorAll('.sortable-header.menu-open').forEach(function(cell) {
        if (cell !== exceptHeaderCell) {
          cell.classList.remove('menu-open');
        }
      });
    }

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          '<button type="button" class="column-menu-trigger" data-column-key="' + column.key + '" aria-label="打开' + column.label + '排序和筛选">▼</button>' +
          '<div class="column-menu">' +
            '<div class="column-menu-label">' + column.label + '</div>' +
            '<div class="column-menu-actions">' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="clear" data-column-key="' + column.key + '">清除排序</button>' +
            '</div>' +
            '<div class="menu-divider"></div>' +
            '<label class="menu-filter-title" for="filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key + '">筛选</label>' +
            '<input type="text" id="filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key + '" class="column-filter" data-column-key="' + column.key + '" placeholder="输入包含内容" autocomplete="off">' +
            '<div class="menu-filter-hint">支持模糊匹配，例如域名、日期或注册商关键字。</div>' +
            '<div class="column-menu-actions" style="margin-top:8px;">' +
              '<button type="button" class="menu-action" data-filter-clear="' + column.key + '">清空筛选</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const hasSort = state.sortKey === columnKey && Boolean(state.sortDirection);
        const hasFilter = String(state.filters[columnKey] || '').trim() !== '';
        const stateEl = cell.querySelector('.header-state');
        const trigger = cell.querySelector('.column-menu-trigger');
        const filterInput = cell.querySelector('.column-filter');

        if (stateEl) {
          stateEl.textContent = hasSort
            ? (state.sortDirection === 'asc' ? '↑' : '↓') + (hasFilter ? ' 筛' : '')
            : (hasFilter ? '筛' : '');
        }

        if (trigger) {
          trigger.classList.toggle('is-active', hasSort || hasFilter);
        }

        if (filterInput && filterInput.value !== String(state.filters[columnKey] || '')) {
          filterInput.value = String(state.filters[columnKey] || '');
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    function buildFilterControlsMarkup(column, filterId) {
      const filterMode = column.filterMode || 'text';
      if (filterMode === 'none') {
        return '<div class="filter-placeholder"></div>';
      }

      if (filterMode === 'select') {
        const options = Array.isArray(column.filterOptions) ? column.filterOptions : [];
        return '<select id="' + filterId + '" class="column-filter-select" data-column-key="' + column.key + '">' +
          '<option value="">全部</option>' +
          options.map(function(option) {
            return '<option value="' + escapeMenuHtml(option.value) + '">' + escapeMenuHtml(option.label) + '</option>';
          }).join('') +
        '</select>';
      }

      if (filterMode === 'range') {
        const rangeType = column.rangeType === 'date' ? 'date' : 'number';
        const inputMode = rangeType === 'date' ? 'numeric' : 'decimal';
        const maxLength = rangeType === 'date' ? ' maxlength="8"' : '';
        const placeholderMin = rangeType === 'date' ? '起始 YYYYMMDD' : '最小值';
        const placeholderMax = rangeType === 'date' ? '结束 YYYYMMDD' : '最大值';
        return '<div class="column-range-stack">' +
          '<label class="column-range-field">' +
            '<span class="column-range-label">起始</span>' +
            '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="min" data-range-type="' + rangeType + '" placeholder="' + placeholderMin + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
          '</label>' +
          '<label class="column-range-field">' +
            '<span class="column-range-label">结束</span>' +
            '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="max" data-range-type="' + rangeType + '" placeholder="' + placeholderMax + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
          '</label>' +
        '</div>';
      }

      return '<div class="column-filter-wrap">' +
        '<input type="text" id="' + filterId + '" class="column-filter" data-column-key="' + column.key + '" placeholder="筛选" autocomplete="off">' +
        '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
      '</div>';
    }

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const thead = table.querySelector('thead');
      const headerRow = thead ? thead.querySelector('tr') : null;
      if (!thead || !headerRow) {
        return;
      }

      const existingFilterRow = thead.querySelector('.filter-row');
      if (existingFilterRow) {
        existingFilterRow.remove();
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        const canSort = column.sortEnabled !== false;
        const sortMarkup = canSort
          ? '<div class="header-sort-buttons">' +
              '<button type="button" class="sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>'
          : '';

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          sortMarkup +
        '</div>';
      });

      const filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      filterRow.innerHTML = columns.map(function(column) {
        const filterId = 'filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key;
        return '<th class="' + (column.className || '') + '">' +
          '<div class="filter-cell">' + buildFilterControlsMarkup(column, filterId) + '</div>' +
        '</th>';
      }).join('');
      thead.appendChild(filterRow);

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const column = getColumnConfig(table, columnKey);
        const normalizedFilter = normalizeFilterState(column, state.filters[columnKey]);
        const hasSort = Boolean(column && column.sortEnabled !== false && state.sortKey === columnKey && state.sortDirection);
        const hasFilter = hasActiveFilter(column, normalizedFilter);
        const stateEl = cell.querySelector('.header-state');
        const filterInput = table.querySelector('.column-filter[data-column-key="' + columnKey + '"]');
        const filterSelect = table.querySelector('.column-filter-select[data-column-key="' + columnKey + '"]');
        const rangeInputs = table.querySelectorAll('.column-range-input[data-column-key="' + columnKey + '"]');
        const clearButton = table.querySelector('[data-filter-clear-button="' + columnKey + '"]');

        state.filters[columnKey] = normalizedFilter;

        if (stateEl) {
          stateEl.textContent = hasFilter ? '筛' : '';
        }

        if (filterInput && filterInput.value !== normalizedFilter.value) {
          filterInput.value = normalizedFilter.value || '';
        }

        if (filterSelect && filterSelect.value !== (normalizedFilter.value || '')) {
          filterSelect.value = normalizedFilter.value || '';
        }

        rangeInputs.forEach(function(input) {
          const bound = input.dataset.rangeBound;
          const expectedValue = normalizedFilter[bound] || '';
          if (input.value !== expectedValue) {
            input.value = expectedValue;
          }
        });

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const column = getColumnConfig(table, button.dataset.columnKey);
        const isActive = Boolean(column && column.sortEnabled !== false && button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection);
        button.classList.toggle('is-active', isActive);
      });
    }

    function initializeInteractiveTables() {
      document.querySelectorAll('.js-interactive-table').forEach(function(table) {
        table.dataset.interactiveReady = '';
        enhanceInteractiveTable(table, getTableColumns(table));
        refreshInteractiveTable(table);
      });
    }

    document.querySelectorAll('.admin-inline-input').forEach(function(input) {
      updateAdminFieldState(input);
    });

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        const filterId = 'filter-' + table.className.replace(/\s+/g, '-') + '-' + column.key;
        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          '<button type="button" class="column-menu-trigger" data-column-key="' + column.key + '" aria-label="打开' + column.label + '排序和筛选">▼</button>' +
          '<div class="column-menu">' +
            '<div class="column-menu-label">' + column.label + '</div>' +
            '<div class="column-menu-actions">' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>' +
            '<div class="menu-divider"></div>' +
            '<label class="menu-filter-title" for="' + filterId + '">筛选</label>' +
            '<div class="column-filter-wrap">' +
              '<input type="text" id="' + filterId + '" class="column-filter" data-column-key="' + column.key + '" placeholder="输入包含内容" autocomplete="off">' +
              '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
            '</div>' +
            '<div class="menu-filter-hint">支持模糊匹配，例如域名、日期或注册商关键字。</div>' +
          '</div>' +
        '</div>';
      });

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const hasSort = state.sortKey === columnKey && Boolean(state.sortDirection);
        const hasFilter = String(state.filters[columnKey] || '').trim() !== '';
        const stateEl = cell.querySelector('.header-state');
        const trigger = cell.querySelector('.column-menu-trigger');
        const filterInput = cell.querySelector('.column-filter');
        const clearButton = cell.querySelector('.filter-clear-btn');

        if (stateEl) {
          stateEl.textContent = hasSort
            ? (state.sortDirection === 'asc' ? '↑' : '↓') + (hasFilter ? ' 筛' : '')
            : (hasFilter ? '筛' : '');
        }

        if (trigger) {
          trigger.classList.toggle('is-active', hasSort || hasFilter);
        }

        if (filterInput && filterInput.value !== String(state.filters[columnKey] || '')) {
          filterInput.value = String(state.filters[columnKey] || '');
        }

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const isActive = button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection;
        button.classList.toggle('is-active', isActive);
      });
    }

    function getTableColumns(table) {
      if (table.classList.contains('nested-table')) {
        return interactiveTableConfigs.nested;
      }
      return interactiveTableConfigs.top;
    }

    function getColumnConfig(table, columnKey) {
      return getTableColumns(table).find(function(column) {
        return column.key === columnKey;
      }) || null;
    }

    function escapeMenuHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function normalizeTextFilterValue(value) {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeDateRangeValue(value) {
      return String(value || '').replace(/\\D/g, '').slice(0, 8);
    }

    function normalizeNumberRangeValue(value) {
      const normalized = String(value == null ? '' : value).trim().replace(/[^\\d.-]/g, '');
      if (!normalized) {
        return '';
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? String(parsed) : '';
    }

    function createEmptyFilterState(column) {
      if (column && column.filterMode === 'range') {
        return { min: '', max: '' };
      }
      return { value: '' };
    }

    function normalizeFilterState(column, rawValue) {
      if (!column || column.filterMode === 'none') {
        return createEmptyFilterState(column);
      }

      if (column.filterMode === 'range') {
        const source = rawValue && typeof rawValue === 'object' ? rawValue : {};
        const normalizer = column.rangeType === 'date' ? normalizeDateRangeValue : normalizeNumberRangeValue;
        return {
          min: normalizer(source.min),
          max: normalizer(source.max)
        };
      }

      return {
        value: normalizeTextFilterValue(rawValue && typeof rawValue === 'object' ? rawValue.value : rawValue)
      };
    }

    function hasActiveFilter(column, filterState) {
      if (!column || column.filterMode === 'none') {
        return false;
      }

      const normalized = normalizeFilterState(column, filterState);
      if (column.filterMode === 'range') {
        return Boolean(normalized.min || normalized.max);
      }

      return Boolean(normalized.value);
    }

    function normalizeSortValue(value, sortType) {
      if (sortType === 'number' || sortType === 'date') {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
      }
      return String(value || '').toLowerCase();
    }

    function getComparableRangeValue(value, rangeType) {
      if (rangeType === 'date') {
        const digits = normalizeDateRangeValue(value);
        return digits.length === 8 ? Number(digits) : Number.NaN;
      }

      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : Number.NaN;
    }

    function rowMatchesColumnFilter(row, column, filterState) {
      if (!column || column.filterMode === 'none') {
        return true;
      }

      const normalized = normalizeFilterState(column, filterState);
      if (column.filterMode === 'select') {
        if (!normalized.value) {
          return true;
        }
        const rowValue = normalizeTextFilterValue(row.getAttribute('data-filter-' + column.key));
        return rowValue === normalized.value;
      }

      if (column.filterMode === 'range') {
        if (!normalized.min && !normalized.max) {
          return true;
        }

        const rowValue = getComparableRangeValue(row.getAttribute('data-sort-' + column.key), column.rangeType);
        if (!Number.isFinite(rowValue)) {
          return false;
        }

        if (normalized.min) {
          const minValue = getComparableRangeValue(normalized.min, column.rangeType);
          if (Number.isFinite(minValue) && rowValue < minValue) {
            return false;
          }
        }

        if (normalized.max) {
          const maxValue = getComparableRangeValue(normalized.max, column.rangeType);
          if (Number.isFinite(maxValue) && rowValue > maxValue) {
            return false;
          }
        }

        return true;
      }

      const rowText = normalizeTextFilterValue(row.getAttribute('data-filter-' + column.key));
      return !normalized.value || rowText.includes(normalized.value);
    }

    function buildFilterControlsMarkup(column, filterId) {
      const filterMode = column.filterMode || 'text';
      if (filterMode === 'none') {
        return '';
      }

      if (filterMode === 'select') {
        const options = Array.isArray(column.filterOptions) ? column.filterOptions : [];
        return '<label class="menu-filter-title" for="' + filterId + '">筛选</label>' +
          '<select id="' + filterId + '" class="column-filter-select" data-column-key="' + column.key + '">' +
            '<option value="">全部</option>' +
            options.map(function(option) {
              return '<option value="' + escapeMenuHtml(option.value) + '">' + escapeMenuHtml(option.label) + '</option>';
            }).join('') +
          '</select>' +
          '<div class="menu-filter-hint">定性字段使用预选项筛选。</div>';
      }

      if (filterMode === 'range') {
        const rangeType = column.rangeType === 'date' ? 'date' : 'number';
        const inputMode = rangeType === 'date' ? 'numeric' : 'decimal';
        const maxLength = rangeType === 'date' ? ' maxlength="8"' : '';
        const placeholderMin = rangeType === 'date' ? 'YYYYMMDD 起始' : '最小值';
        const placeholderMax = rangeType === 'date' ? 'YYYYMMDD 结束' : '最大值';
        const hint = rangeType === 'date' ? '定量日期字段支持 YYYYMMDD 范围。' : '定量字段支持数字范围。';
        return '<label class="menu-filter-title">筛选范围</label>' +
          '<div class="column-range-stack">' +
            '<label class="column-range-field">' +
              '<span class="column-range-label">起始</span>' +
              '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="min" data-range-type="' + rangeType + '" placeholder="' + placeholderMin + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
            '</label>' +
            '<label class="column-range-field">' +
              '<span class="column-range-label">结束</span>' +
              '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="max" data-range-type="' + rangeType + '" placeholder="' + placeholderMax + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
            '</label>' +
          '</div>' +
          '<div class="menu-filter-hint">' + hint + '</div>';
      }

      return '<label class="menu-filter-title" for="' + filterId + '">筛选</label>' +
        '<div class="column-filter-wrap">' +
          '<input type="text" id="' + filterId + '" class="column-filter" data-column-key="' + column.key + '" placeholder="输入包含内容" autocomplete="off">' +
          '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
        '</div>' +
        '<div class="menu-filter-hint">支持模糊匹配。</div>';
    }

    function syncTableWrapperMenuSpacing(targetTable) {
      const tables = targetTable
        ? [targetTable]
        : Array.from(document.querySelectorAll('.js-interactive-table'));

      tables.forEach(function(table) {
        const wrapper = table && table.closest('.table-wrapper');
        const panel = table && table.closest('.panel');
        if (!wrapper) {
          if (panel) {
            panel.style.marginBottom = '';
          }
          return;
        }

        const openMenu = table.querySelector('.sortable-header.menu-open .column-menu');
        if (!openMenu) {
          wrapper.style.paddingBottom = '';
          if (panel) {
            panel.style.marginBottom = '';
          }
          return;
        }

        const panelRect = panel ? panel.getBoundingClientRect() : null;
        const menuRect = openMenu.getBoundingClientRect();
        const panelOverflow = panelRect ? Math.max(0, Math.ceil(menuRect.bottom - panelRect.bottom + 20)) : 0;
        wrapper.style.paddingBottom = '';
        if (panel) {
          panel.style.marginBottom = panelOverflow > 0 ? panelOverflow + 'px' : '';
        }
      });
    }

    function refreshInteractiveTable(table) {
      if (!table || !table.classList.contains('js-interactive-table')) {
        return;
      }

      const columns = getTableColumns(table);
      const state = getInteractiveTableState(table);
      const tbody = table.tBodies[0];
      if (!tbody) {
        return;
      }

      const allRows = Array.from(tbody.querySelectorAll('tr.table-data-row'));
      const visibleRows = allRows.filter(function(row) {
        return columns.every(function(column) {
          const normalizedFilter = normalizeFilterState(column, state.filters[column.key]);
          state.filters[column.key] = normalizedFilter;
          return rowMatchesColumnFilter(row, column, normalizedFilter);
        });
      });

      const sortColumn = columns.find(function(column) {
        return column.key === state.sortKey;
      });
      const hasActiveFilters = columns.some(function(column) {
        return hasActiveFilter(column, state.filters[column.key]);
      });

      if (sortColumn && state.sortDirection && sortColumn.sortEnabled !== false) {
        visibleRows.sort(function(a, b) {
          const aValue = normalizeSortValue(a.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          const bValue = normalizeSortValue(b.getAttribute('data-sort-' + sortColumn.key), sortColumn.sortType);
          if (aValue === bValue) {
            const domainA = String(a.getAttribute('data-sort-domain') || '').toLowerCase();
            const domainB = String(b.getAttribute('data-sort-domain') || '').toLowerCase();
            return state.sortDirection === 'desc'
              ? domainB.localeCompare(domainA)
              : domainA.localeCompare(domainB);
          }
          return state.sortDirection === 'desc'
            ? (aValue < bValue ? 1 : -1)
            : (aValue > bValue ? 1 : -1);
        });
      }

      const hiddenRows = allRows.filter(function(row) {
        return !visibleRows.includes(row);
      });
      const fragment = document.createDocumentFragment();

      visibleRows.forEach(function(row) {
        row.style.display = '';
        fragment.appendChild(row);
      });
      hiddenRows.forEach(function(row) {
        row.style.display = 'none';
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      const existingFilterEmptyRow = tbody.querySelector('.filter-empty-row');
      if (existingFilterEmptyRow) {
        existingFilterEmptyRow.remove();
      }

      if (visibleRows.length === 0 && allRows.length > 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyRow.className = 'filter-empty-row';
        emptyCell.className = 'empty-cell';
        emptyCell.colSpan = table.tHead && table.tHead.rows[0]
          ? table.tHead.rows[0].cells.length
          : columns.length;
        emptyCell.textContent = hasActiveFilters
          ? '当前筛选没有匹配结果'
          : '暂无可显示的域名';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }

      updateSortButtons(table, state);
      syncTableWrapperMenuSpacing(table);
    }

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns || table.dataset.interactiveReady === 'true') {
        return;
      }

      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        return;
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        const canSort = column.sortEnabled !== false;
        const filterMode = column.filterMode || 'text';
        const canFilter = filterMode !== 'none';
        const canOpenMenu = canSort || canFilter;
        const filterId = 'filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key;
        const sortActions = canSort
          ? '<div class="column-menu-actions">' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="menu-action sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>'
          : '';
        const divider = canSort && canFilter ? '<div class="menu-divider"></div>' : '';
        const filterMarkup = canFilter ? buildFilterControlsMarkup(column, filterId) : '<div class="menu-filter-hint">该列不支持排序和筛选。</div>';
        const triggerMarkup = canOpenMenu
          ? '<button type="button" class="column-menu-trigger" data-column-key="' + column.key + '" aria-label="打开' + column.label + '排序和筛选">▼</button>' +
            '<div class="column-menu">' +
              '<div class="column-menu-label">' + column.label + '</div>' +
              sortActions +
              divider +
              filterMarkup +
            '</div>'
          : '';

        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          triggerMarkup +
        '</div>';
      });

      table.dataset.interactiveReady = 'true';
      table._interactiveState = { sortKey: '', sortDirection: '', filters: {} };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const column = getColumnConfig(table, columnKey);
        const normalizedFilter = normalizeFilterState(column, state.filters[columnKey]);
        const hasSort = Boolean(column && column.sortEnabled !== false && state.sortKey === columnKey && state.sortDirection);
        const hasFilter = hasActiveFilter(column, normalizedFilter);
        const stateEl = cell.querySelector('.header-state');
        const trigger = cell.querySelector('.column-menu-trigger');
        const filterInput = cell.querySelector('.column-filter');
        const filterSelect = cell.querySelector('.column-filter-select');
        const rangeInputs = cell.querySelectorAll('.column-range-input');
        const clearButton = cell.querySelector('.filter-clear-btn');

        state.filters[columnKey] = normalizedFilter;

        if (stateEl) {
          stateEl.textContent = hasSort
            ? (state.sortDirection === 'asc' ? '↑' : '↓') + (hasFilter ? ' 筛' : '')
            : (hasFilter ? '筛' : '');
        }

        if (trigger) {
          trigger.classList.toggle('is-active', hasSort || hasFilter);
        }

        if (filterInput && filterInput.value !== normalizedFilter.value) {
          filterInput.value = normalizedFilter.value || '';
        }

        if (filterSelect && filterSelect.value !== (normalizedFilter.value || '')) {
          filterSelect.value = normalizedFilter.value || '';
        }

        rangeInputs.forEach(function(input) {
          const bound = input.dataset.rangeBound;
          const expectedValue = normalizedFilter[bound] || '';
          if (input.value !== expectedValue) {
            input.value = expectedValue;
          }
        });

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const column = getColumnConfig(table, button.dataset.columnKey);
        const isActive = Boolean(column && column.sortEnabled !== false && button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection);
        button.classList.toggle('is-active', isActive);
      });
    }

    function initializeInteractiveTables() {
      document.querySelectorAll('.js-interactive-table').forEach(function(table) {
        table.dataset.interactiveReady = '';
        enhanceInteractiveTable(table, getTableColumns(table));
        refreshInteractiveTable(table);
      });
    }

    document.addEventListener('change', function(event) {
      const filterSelect = event.target.closest('.column-filter-select');
      if (!filterSelect) {
        return;
      }

      const table = filterSelect.closest('.js-interactive-table');
      const column = table ? getColumnConfig(table, filterSelect.dataset.columnKey) : null;
      if (!table || !column) {
        return;
      }

      const state = getInteractiveTableState(table);
      state.filters[column.key] = { value: normalizeTextFilterValue(filterSelect.value) };
      refreshInteractiveTable(table);
    });

    document.addEventListener('input', function(event) {
      const rangeInput = event.target.closest('.column-range-input');
      if (!rangeInput) {
        return;
      }

      const table = rangeInput.closest('.js-interactive-table');
      const column = table ? getColumnConfig(table, rangeInput.dataset.columnKey) : null;
      if (!table || !column) {
        return;
      }

      const state = getInteractiveTableState(table);
      const normalizedFilter = normalizeFilterState(column, state.filters[column.key]);
      const normalizer = column.rangeType === 'date' ? normalizeDateRangeValue : normalizeNumberRangeValue;
      normalizedFilter[rangeInput.dataset.rangeBound] = normalizer(rangeInput.value);
      state.filters[column.key] = normalizedFilter;
      refreshInteractiveTable(table);
    });

    document.addEventListener('click', function(event) {
      const menuTrigger = event.target.closest('.column-menu-trigger');
      if (!menuTrigger) {
        return;
      }

      setTimeout(function() {
        const headerCell = menuTrigger.closest('.sortable-header');
        const focusTarget = headerCell
          ? headerCell.querySelector('.column-filter, .column-filter-select, .column-range-input')
          : null;
        if (focusTarget) {
          focusTarget.focus();
          if (typeof focusTarget.select === 'function') {
            focusTarget.select();
          }
        }
      }, 0);
    });

    function buildFilterControlsMarkup(column, filterId) {
      const filterMode = column.filterMode || 'text';
      if (filterMode === 'none') {
        return '<div class="filter-placeholder"></div>';
      }

      if (filterMode === 'select') {
        const options = Array.isArray(column.filterOptions) ? column.filterOptions : [];
        return '<select id="' + filterId + '" class="column-filter-select" data-column-key="' + column.key + '">' +
          '<option value="">全部</option>' +
          options.map(function(option) {
            return '<option value="' + escapeMenuHtml(option.value) + '">' + escapeMenuHtml(option.label) + '</option>';
          }).join('') +
        '</select>';
      }

      if (filterMode === 'range') {
        const rangeType = column.rangeType === 'date' ? 'date' : 'number';
        const inputMode = rangeType === 'date' ? 'numeric' : 'decimal';
        const maxLength = rangeType === 'date' ? ' maxlength="8"' : '';
        const placeholderMin = rangeType === 'date' ? '起始 YYYYMMDD' : '最小值';
        const placeholderMax = rangeType === 'date' ? '结束 YYYYMMDD' : '最大值';
        return '<div class="column-range-stack">' +
          '<label class="column-range-field">' +
            '<span class="column-range-label">起始</span>' +
            '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="min" data-range-type="' + rangeType + '" placeholder="' + placeholderMin + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
          '</label>' +
          '<label class="column-range-field">' +
            '<span class="column-range-label">结束</span>' +
            '<input type="text" class="column-range-input" data-column-key="' + column.key + '" data-range-bound="max" data-range-type="' + rangeType + '" placeholder="' + placeholderMax + '" inputmode="' + inputMode + '"' + maxLength + ' autocomplete="off">' +
          '</label>' +
        '</div>';
      }

      return '<div class="column-filter-wrap">' +
        '<input type="text" id="' + filterId + '" class="column-filter" data-column-key="' + column.key + '" placeholder="筛选" autocomplete="off">' +
        '<button type="button" class="filter-clear-btn" data-filter-clear-button="' + column.key + '" aria-label="清空' + column.label + '筛选">×</button>' +
      '</div>';
    }

    function enhanceInteractiveTable(table, columns) {
      if (!table || !columns) {
        return;
      }

      const thead = table.querySelector('thead');
      const headerRow = thead ? thead.querySelector('tr') : null;
      if (!thead || !headerRow) {
        return;
      }

      const existingFilterRow = thead.querySelector('.filter-row');
      if (existingFilterRow) {
        existingFilterRow.remove();
      }

      const headerCells = Array.from(headerRow.children);
      columns.forEach(function(column, index) {
        const cell = headerCells[index];
        if (!cell) {
          return;
        }

        const canSort = column.sortEnabled !== false;
        const sortMarkup = canSort
          ? '<div class="header-sort-buttons">' +
              '<button type="button" class="sort-btn" data-sort-button="asc" data-column-key="' + column.key + '" aria-label="升序" title="升序">&#8593;</button>' +
              '<button type="button" class="sort-btn" data-sort-button="desc" data-column-key="' + column.key + '" aria-label="降序" title="降序">&#8595;</button>' +
            '</div>'
          : '';

        cell.className = column.className || '';
        cell.classList.add('sortable-header');
        cell.dataset.columnKey = column.key;
        cell.dataset.sortType = column.sortType || 'text';
        cell.innerHTML = '<div class="header-cell">' +
          '<div class="header-text">' +
            '<span class="header-title">' + column.label + '</span>' +
            '<span class="header-state"></span>' +
          '</div>' +
          sortMarkup +
        '</div>';
      });

      const filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      filterRow.innerHTML = columns.map(function(column) {
        const filterId = 'filter-' + table.className.replace(/\\s+/g, '-') + '-' + column.key;
        return '<th class="' + (column.className || '') + '">' +
          '<div class="filter-cell">' + buildFilterControlsMarkup(column, filterId) + '</div>' +
        '</th>';
      }).join('');
      thead.appendChild(filterRow);

      table.dataset.interactiveReady = 'true';
      const existingState = table._interactiveState || {};
      table._interactiveState = {
        sortKey: existingState.sortKey || 'days',
        sortDirection: existingState.sortDirection || 'asc',
        filters: existingState.filters || {}
      };
    }

    function updateSortButtons(table, state) {
      table.querySelectorAll('.sortable-header').forEach(function(cell) {
        const columnKey = cell.dataset.columnKey;
        const column = getColumnConfig(table, columnKey);
        const normalizedFilter = normalizeFilterState(column, state.filters[columnKey]);
        const hasFilter = hasActiveFilter(column, normalizedFilter);
        const stateEl = cell.querySelector('.header-state');
        const filterInput = table.querySelector('.column-filter[data-column-key="' + columnKey + '"]');
        const filterSelect = table.querySelector('.column-filter-select[data-column-key="' + columnKey + '"]');
        const rangeInputs = table.querySelectorAll('.column-range-input[data-column-key="' + columnKey + '"]');
        const clearButton = table.querySelector('[data-filter-clear-button="' + columnKey + '"]');

        state.filters[columnKey] = normalizedFilter;

        if (stateEl) {
          stateEl.textContent = hasFilter ? '筛' : '';
        }

        if (filterInput && filterInput.value !== normalizedFilter.value) {
          filterInput.value = normalizedFilter.value || '';
        }

        if (filterSelect && filterSelect.value !== (normalizedFilter.value || '')) {
          filterSelect.value = normalizedFilter.value || '';
        }

        rangeInputs.forEach(function(input) {
          const bound = input.dataset.rangeBound;
          const expectedValue = normalizedFilter[bound] || '';
          if (input.value !== expectedValue) {
            input.value = expectedValue;
          }
        });

        if (clearButton) {
          clearButton.classList.toggle('is-visible', hasFilter);
        }
      });

      table.querySelectorAll('.sort-btn[data-sort-button]').forEach(function(button) {
        const column = getColumnConfig(table, button.dataset.columnKey);
        const isActive = Boolean(column && column.sortEnabled !== false && button.dataset.columnKey === state.sortKey && button.dataset.sortButton === state.sortDirection);
        button.classList.toggle('is-active', isActive);
      });
    }

    initializeCompactDateFields();
    initializeInteractiveTables();

    document.querySelector('.domain-modal-close').addEventListener('click', function() {
      document.getElementById('domainPropsModal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
      if (event.target === document.getElementById('domainPropsModal')) {
        document.getElementById('domainPropsModal').style.display = 'none';
      }
    });

    async function resetCustomFlag(domain) {
      if (!confirm('确定要将 ' + domain + ' 重置为非自定义域名吗？这会在下次同步时按 Cloudflare 状态处理。')) {
        return;
      }

      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuthHeader
          },
          body: JSON.stringify({
            action: 'reset-custom',
            domain
          })
        });

        if (!response.ok) {
          throw new Error('重置失败');
        }

        alert('重置成功');
        location.reload();
      } catch (error) {
        alert('重置失败: ' + error.message);
      }
    }

    ${isAdmin ? `
      document.getElementById('addCustomDomainForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const domain = document.getElementById('newDomain').value.trim();
        const payload = {
          action: 'add',
          domain,
          system: document.getElementById('newSystem').value.trim(),
          registrar: document.getElementById('newRegistrar').value.trim(),
          registrationDate: compactDateToStorageValue(document.getElementById('newRegistrationDate').value),
          expirationDate: compactDateToStorageValue(document.getElementById('newExpirationDate').value),
          secondLevelRegistrationDate: compactDateToStorageValue(document.getElementById('newSecondLevelRegistrationDate').value),
          secondLevelExpirationDate: compactDateToStorageValue(document.getElementById('newSecondLevelExpirationDate').value)
        };

        if (domain.split('.').filter(Boolean).length > 2) {
          payload.parentRegistrationDate = payload.registrationDate;
          payload.parentExpirationDate = payload.expirationDate;
        }

        try {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': adminAuthHeader
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || '添加失败');
          }

          alert('添加成功');
          location.reload();
        } catch (error) {
          alert('添加失败: ' + error.message);
        }
      });

      document.getElementById('saveAllDomainsBtn').addEventListener('click', async function() {
        await saveAllDomains();
      });

      document.getElementById('updateAllWhoisBtn').addEventListener('click', async function() {
        await updateAllWhois();
      });

      document.getElementById('syncCloudflareBtn').addEventListener('click', async function() {
        if (!confirm('确定要同步 Cloudflare 域名列表吗？这会刷新域名状态，并可能移除已不存在的域名记录。')) {
          return;
        }

        const statusEl = document.getElementById('syncStatus');
        statusEl.textContent = '正在同步...';

        try {
          const response = await fetch('/api/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': adminAuthHeader
            },
            body: JSON.stringify({
              action: 'sync-cloudflare'
            })
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || '同步失败');
          }

          statusEl.textContent = '同步成功，共获取 ' + result.count + ' 个域名';
          if (result.domains && result.domains.length > 0) {
            alert('成功同步以下域名：\\n\\n' + result.domains.join('\\n'));
          }

          setTimeout(function() {
            location.reload();
          }, 1200);
        } catch (error) {
          statusEl.textContent = '同步失败: ' + error.message;
        }
      });
    ` : ''}
    </script>
    ${footerHTML}
  </body>
  </html>
  `;
}

function getStatusColor(daysRemaining) {
  if (isNaN(daysRemaining)) return '#808080'; // 灰色表示未知状态
  if (daysRemaining <= 7) return '#ff0000'; // 红色
  if (daysRemaining <= 30) return '#ffa500'; // 橙色
  if (daysRemaining <= 90) return '#ffff00'; // 黄色
  return '#00ff00'; // 绿色
}

function getStatusTitle(daysRemaining) {
  if (isNaN(daysRemaining)) return '未知状态';
  if (daysRemaining <= 7) return '紧急';
  if (daysRemaining <= 30) return '警告';
  if (daysRemaining <= 90) return '注意';
  return '正常';
}

function categorizeDomainsLegacy(domains) {
  if (!domains || !Array.isArray(domains)) {
    console.error('Invalid domains input:', domains);
    return { cfTopLevel: [], cfSecondLevelAndCustom: [] };
  }

  return domains.reduce((acc, domain) => {
    if (domain.system === 'Cloudflare' && domain.domain.split('.').length === 2) {
      acc.cfTopLevel.push(domain);
    } else {
      acc.cfSecondLevelAndCustom.push(domain);
    }
    return acc;
  }, { cfTopLevel: [], cfSecondLevelAndCustom: [] });
}

function categorizeDomains(domains) {
  if (!domains || !Array.isArray(domains)) {
    console.error('Invalid domains input:', domains);
    return { cfTopLevel: [], cfSecondLevel: [], customDomains: [], cfSecondLevelAndCustom: [] };
  }

  const categorized = domains.reduce((acc, domain) => {
    if (domain.system === 'Cloudflare' && isTopLevelDomain(domain.domain)) {
      acc.cfTopLevel.push(domain);
    } else if (domain.isCustom) {
      acc.customDomains.push(domain);
      acc.cfSecondLevelAndCustom.push(domain);
    } else {
      acc.cfSecondLevel.push(domain);
      acc.cfSecondLevelAndCustom.push(domain);
    }
    return acc;
  }, { cfTopLevel: [], cfSecondLevel: [], customDomains: [], cfSecondLevelAndCustom: [] });

  categorized.cfTopLevel.sort((a, b) => String(a.domain || '').localeCompare(String(b.domain || '')));
  categorized.cfSecondLevel.sort((a, b) => String(a.domain || '').localeCompare(String(b.domain || '')));
  categorized.customDomains.sort((a, b) => String(a.domain || '').localeCompare(String(b.domain || '')));
  categorized.cfSecondLevelAndCustom.sort((a, b) => String(a.domain || '').localeCompare(String(b.domain || '')));

  return categorized;
}
