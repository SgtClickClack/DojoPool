# DNS Configuration for dojopool.com.au

## A Records

Add the following A records to point to Firebase's IP addresses:

```
@  151.101.1.195
@  151.101.65.195
```

## TXT Records

Add the following TXT record for domain verification:

```
@  google-site-verification=your_verification_code
```

## CNAME Records

Add the following CNAME record for the www subdomain:

```
www  dojopool.com.au
```

## MX Records (Optional - for future email setup)

```
@  10 aspmx.l.google.com
@  20 alt1.aspmx.l.google.com
@  30 alt2.aspmx.l.google.com
```

## SSL Configuration

Firebase Hosting automatically provisions and manages SSL certificates.

## Verification Steps

1. Run `dig dojopool.com.au` to verify A records
2. Run `dig www.dojopool.com.au` to verify CNAME record
3. Visit https://dojopool.com.au and verify SSL certificate
4. Visit https://www.dojopool.com.au and verify SSL certificate

## Propagation

DNS changes may take up to 48 hours to propagate globally. However, they typically take effect within a few hours.
