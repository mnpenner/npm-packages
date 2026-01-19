#!/usr/bin/env bun
import countryDb from './GeoLite2-Country.mmdb'
import asnDb from './GeoLite2-ASN.mmdb'

import {createReadStream} from 'node:fs'
import * as readline from 'node:readline'

console.log({countryDb, asnDb})

type AsnEntry = {asn: number; org: string}
type Output = {
    asns: AsnEntry[]
    orgs: string[]
    countryCodes: string[]
}

const ASN_V4_CSV = './GeoLite2-ASN-Blocks-IPv4.csv'
const ASN_V6_CSV = './GeoLite2-ASN-Blocks-IPv6.csv'
const COUNTRY_LOCATIONS_CSV = './GeoLite2-Country-Locations-en.csv'

const parseCsvLine = (line: string): string[] => {
    // Minimal RFC4180-ish parser: commas + double-quote escaping
    const out: string[] = []
    let cur = ''
    let i = 0
    let inQuotes = false

    while (i < line.length) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"') {
                const next = line[i + 1]
                if (next === '"') {
                    cur += '"'
                    i += 2
                    continue
                }
                inQuotes = false
                i++
                continue
            }
            cur += ch
            i++
            continue
        }

        if (ch === '"') {
            inQuotes = true
            i++
            continue
        }

        if (ch === ',') {
            out.push(cur)
            cur = ''
            i++
            continue
        }

        cur += ch
        i++
    }

    out.push(cur)
    return out
}

const parseAsnBlocks = async (path: string, asnToOrgs: Map<number, Set<string>>) => {
    const rl = readline.createInterface({input: createReadStream(path), crlfDelay: Infinity})

    let header: string[] | null = null
    let idxAsn = -1
    let idxOrg = -1

    for await (const line of rl) {
        if (!line) continue

        if (!header) {
            header = parseCsvLine(line)
            idxAsn = header.indexOf('autonomous_system_number')
            idxOrg = header.indexOf('autonomous_system_organization')
            if (idxAsn === -1 || idxOrg === -1) {
                throw new Error(`Unexpected ASN CSV header in ${path}`)
            }
            continue
        }

        const row = parseCsvLine(line)
        const asnStr = row[idxAsn]?.trim()
        const org = row[idxOrg]?.trim()

        if (!asnStr) continue
        const asn = Number(asnStr)
        if (!Number.isFinite(asn)) continue

        let set = asnToOrgs.get(asn)
        if (!set) {
            set = new Set<string>()
            asnToOrgs.set(asn, set)
        }
        if (org) set.add(org)
    }
}

const parseCountryLocations = async (path: string, countryCodes: Set<string>) => {
    const rl = readline.createInterface({input: createReadStream(path), crlfDelay: Infinity})

    let header: string[] | null = null

    // Present in GeoLite2-Country-Locations-*.csv
    let idxCountry = -1
    let idxReg = -1
    let idxRep = -1

    for await (const line of rl) {
        if (!line) continue

        if (!header) {
            header = parseCsvLine(line)
            idxCountry = header.indexOf('country_iso_code')
            idxReg = header.indexOf('registered_country_iso_code')
            idxRep = header.indexOf('represented_country_iso_code')
            if (idxCountry === -1 && idxReg === -1 && idxRep === -1) {
                throw new Error(`Unexpected Country locations CSV header in ${path}`)
            }
            continue
        }

        const row = parseCsvLine(line)
        for (const idx of [idxCountry, idxReg, idxRep]) {
            if (idx < 0) continue
            const code = row[idx]?.trim()
            if (code) countryCodes.add(code)
        }
    }
}

const asnToOrgs = new Map<number, Set<string>>()
await parseAsnBlocks(ASN_V4_CSV, asnToOrgs)
await parseAsnBlocks(ASN_V6_CSV, asnToOrgs)

const countryCodes = new Set<string>()
await parseCountryLocations(COUNTRY_LOCATIONS_CSV, countryCodes)

const asns: AsnEntry[] = Array.from(asnToOrgs.entries())
    .flatMap(([asn, orgs]) => Array.from(orgs).map(org => ({asn, org})))
    .sort((a, b) => (a.asn - b.asn) || a.org.localeCompare(b.org))

const orgs = Array.from(new Set(asns.map(x => x.org))).sort((a, b) => a.localeCompare(b))
const codes = Array.from(countryCodes).sort((a, b) => a.localeCompare(b))

const out: Output = {
    asns,
    orgs,
    countryCodes: codes,
}

console.log(out)
