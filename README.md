## evec-maildir-flume-source ##

Hi, this is EVE-Central Maildir Flume Source.

* EVE-Online[1] is a massively multiplayer FPS with a virtual economy.
* Inside EVE, players can export all market orders for a given region.
* EVE-Central offers Contribtastic[2], a daemon which will automatically relay these exports 
    to their central market catalog.
* EVE-Central offers an SMTP mailing list[3] to syndicate this content out in CSV format.
* You have access to a mail server which will record incoming EVEc emails in the maildir 
    format[4].
* You operate a Flume[5] logging system and wish to use it to capture EVEc's market data.

EVE-Central Maildir Flume Source will help. It monitors a maildir, csv parses incoming mail,
and if of the expected format it will submit the order information to Flume.

# http://eve-online.com
# http://eve-central.com/home/software.html
# http://eve-central.com/home/develop.html#smtp
# amongst many, http://dovecot.org
# https://cwiki.apache.org/FLUME/
