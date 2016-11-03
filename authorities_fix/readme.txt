1. Check everything is ok:
 - gulp check
   You should see an "ok" confirmation for each of: gulp, database

2. Prepare ground for running repairment scripts (scripts located in "authorities_fix" folder):
 - run ./authorities_fix/prepare_reseed_authorities.sh ldrweb
 - run grunt serve:production (or grunt serve:sandbox if running locally)

3. Fix authorities
 - gulp fixAllocated

4. Switch authorities
 - run ./authorities_fix/switch_authorities.sh ldrweb

 =======================

 Generate stats regarding...
 ...broken authorities: gulp findDamagedAuthorities
 ...broken authorities already allocated: gulp findDamagedAuthorities --allocated

   Interpret stats:
   gulp interpretAuthoritiesStats