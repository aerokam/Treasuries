================================================================================
## THREAD: Taxation of Treasuries
https://www.bogleheads.org/forum/viewtopic.php?t=390405
================================================================================

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			Updated the summary doc with corrections re: dated date and auction date as it relates to accrued interest paid at auction.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Summary doc update
			
[QUOTE: #Cruncher wrote: Sat Feb 21, 2026 4:59 pm]
#Cruncher wrote: Sat Feb 21, 2026 4:59 pm
This is correct except that accrued interest on a Treasury auction is never computed from the auction date. Rather is is computed from the "Dated Date" which is six months before the first interest payment.

I believe that 30-year TIPS are the only Treasury notes or bonds currently with a re-opening auction occurring after the first interest payment of the original auction. In this case the Dated Date of the re-opening will be six months after the Dated Date of the original [1] auction.
[/QUOTE]
Ah yes, dated date, not auction date.

And thanks for clarifying about the 30-year TIPS reopenings having a different dated date.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Summary doc update
			
[QUOTE: RealYield wrote: Sat Feb 21, 2026 2:59 pmKevin M wrote: Sat Feb 21, 2026 1:52 pm]
RealYield wrote: Sat Feb 21, 2026 2:59 pm
Kevin M wrote: Sat Feb 21, 2026 1:52 pm
Did some extensive edits on TaxationOfTreasuries.md. After doing some edits on my own, I asked VS Code to review the doc and suggest edits, and it did a great job. Examples are adding a table of contents and a filing checklist by scenario.

I haven't yet done a thorough review for accuracy (FactualFran, where are you?), but I caught a few things that weren't accurate (e.g., Finance Buffs assertion that there's usually no accrued interest for an original auction) and fixed them.

I guess the real test of the doc will be whether or not it addresses the 6 scenarios adequately for folks who visit this thread as tax season progresses. 

I've designated March as tax prep month, so I'll review the doc to the extent any of the scenarios are applicable as I work on the returns (lots of Treasuries bought, some sold, TIPS in taxable in some accounts, etc.)

Two quick questions/comments on Scenario 2: Reopening Auction → Hold to Maturity (T-Notes/Bonds), that, I admit, are based on my lack of knowledge of the reopening calendar:

1. If the reopening is after the first dividend date then the accrued interest will be calculated from the date of the previous dividend date, not from the original auction date.

2. If the next dividend date (after the purchase at the reopening) is in the following year, then the accrued interest should be deducted from interest paid in the following year, requiring even more careful record keeping.
[/QUOTE]

1. That is true if you buy on secondary market, since you are buying from someone who has held that Treasury. At auction, you are buying directly from Treasury, who you can think of as having held since the original auction. I must admit, I had to think about this one myself, since I always buy on secondary. Look at how accrued interest increased with each reopening for this bond:

2. Yes, technically that's correct, but I've always just deducted it all in the year it's shown on the 1099 composite, to the extent that I had interest from from that broker, and have never had a correction notice from IRS.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Summary doc update
			Did some extensive edits on TaxationOfTreasuries.md. After doing some edits on my own, I asked VS Code to review the doc and suggest edits, and it did a great job. Examples are adding a table of contents and a filing checklist by scenario.

I haven't yet done a thorough review for accuracy (FactualFran, where are you?), but I caught a few things that weren't accurate (e.g., Finance Buffs assertion that there's usually no accrued interest for an original auction) and fixed them.

I guess the real test of the doc will be whether or not it addresses the 6 scenarios adequately for folks who visit this thread as tax season progresses. 

I've designated March as tax prep month, so I'll review the doc to the extent any of the scenarios are applicable as I work on the returns (lots of Treasuries bought, some sold, TIPS in taxable in some accounts, etc.)

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: mmt wrote: Fri Feb 20, 2026 8:06 pm]
mmt wrote: Fri Feb 20, 2026 8:06 pm
My purchase was a treasury reopening auction.

I am looking for advice on how to understand the Vanguard reporting and why it seems to not include OID adjustments.

Dec 31 Price 101.8515 balance 105,076.11 accrued int 1,012.74 remain bal 103,166.00 dec factor tips
How were the price and balance determined? What does Remain bal reflect?

Feb 17 1099 received OID 3202.12 for jan thru dec 1/31/25 treasury accrued int pd -93.90 7/25/25 treasury interest 1081.05
Feb 20 online statement price 103.51 up 0.13 current balance 106,296.16
cost basis cost per share 1.02 total cost 101,634.68 market value 106,296.16 long term capital gain 4,661.48

Was the OID reflected anywhere in the 2/20 online statement or cost basis? Is the long term capital gain misleading, including the OID?
[/QUOTE]
I see that you're still asking about 91282CML2--I see that the index ratio for that one is 1.03166 on 12/31/25, so yep. I'll just address the first question here and will get to the other ones a bit later if no one else does.

A bit confused by "remain bal 103,166.00 dec factor tips". This is 100,000 (face value) times the index ratio, which is the current adjusted principal.

I see the end of day price for 91282CML2 on 12/31/2025 was 101.781250, so in the same ballpark as what you're quoting. Here's the math for the first bit:

Code: Select alladj price = price * indexRatio = 101.8515 * 1.03166 = 105.07612

So for 1,000 amount equals what Vanguard shows off by one cent; they may have used price with more decimals, but close enough. As I mentioned before, Vanguard gets their prices from some 3rd party, and price will be a bit different depending on the source, but for tax reporting, whatever price Vanguard shows should be the one used.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			The AMD clarification was a tiny edit, so it's in main now.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: LadyGeek wrote: Fri Feb 20, 2026 6:52 pm]
LadyGeek wrote: Fri Feb 20, 2026 6:52 pm
I have a few administrative comments. Ask the AI to:

- Reword the introductory paragraph to be like Wikipedia. Wikipedia:Manual of Style/Lead section

- Format the citations to utilize the wiki's Template:Forum link for forum topics. The output may not be usable in GitHub, but at least consider this for the wiki.

Never mind the above. Just ask it to format the entire document to comply with Wikipedia's Wikipedia:Manual of Style and utilize the templates found in the Bogleheads wiki. (The above template is for the forum thread citations.)

It might not be readable to someone who's not a wiki editor, but the content can be entered into the wiki as a draft page for review.
[/QUOTE]
Would rather not get bogged down with wiki stuff until we've got decent review here. OK?

I'm busy just learning how to use GitHub to manage this.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: questionbox wrote: Fri Feb 20, 2026 5:49 pm]
questionbox wrote: Fri Feb 20, 2026 5:49 pm
Incredible KevinM posts and wonderful nomination of FactualFran as delegate -  perfect!  Summary even in current form is helpful, but here is what I wondered about on first pass:
[/QUOTE]
Asked Claude, and here is the reply:

------------------- start Claude --------------------

The discount at original auction is de minimis by definition (less than 0.25% × face value × years to maturity). De minimis discount is treated as a capital gain at maturity — it goes to Schedule D, not Schedule B, and is not AMD in the legal sense. Therefore it carries none of the AMD/state ambiguity discussed in the caveats.

So to directly answer your questions:

The "no AMD/state ambiguity" phrase in the Finance Buff Principle section is accurate for Scenario 1 — the de minimis discount does not trigger AMD treatment.
Finance Buff's "you'll handle this small discount when the bond matures" refers to that tiny de minimis capital gain on 1099-B Box 1d/1e — not Box 1f AMD. It flows to Schedule D as a capital gain; no manual adjustment needed.
The AMD state ambiguity caveat only applies to Scenarios 4, 5, and 6, where a secondary market or reopening purchase creates a discount exceeding de minimis.
For Scenario 1, the "robotic" workflow is: Box 3 (1099-INT) → Schedule B annually; Box 8 (1099-OID, TIPS only) → Schedule B annually; tiny capital gain at maturity → Schedule D. No Box 1f involvement.

The doc should probably state this more explicitly. Will add a clarifying note to Scenario 1.

------------------- end Claude ----------------

I'll add the change to a new branch, and will merge it into main branch if there are no other comments soon.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: mmt wrote: Fri Feb 20, 2026 5:21 pm]
mmt wrote: Fri Feb 20, 2026 5:21 pm
Help me understand my TIPS at Vanguard [cost basis]

Was the OID reflected anywhere in the 2/20 online statement or cost basis? Is the long term capital gain misleading, including the OID?
[/QUOTE]
Already answered the first part above: viewtopic.php?p=8692690#p8692690. Please review the answers to that part; it might help with the subsequent questions. If not, ask follow ups.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kevin M wrote: Fri Feb 20, 2026 3:34 pmLadyGeek wrote: Fri Feb 20, 2026 2:55 pm]
Kevin M wrote: Fri Feb 20, 2026 3:34 pm
LadyGeek wrote: Fri Feb 20, 2026 2:55 pm
Nice job. Is there any way you could add citations where appropriate? If you can have traceability to authoritative references, it can go in the wiki directly.
The reference is this thread, so only citations that exist in the thread would be available. I can certainly have Claude search the thread for relevant citations, and can start a new fork for those edits. On my list.

All edits from now on will be via github, so if that works for the wiki someone can create that article.
[/QUOTE]
Citations added: https://github.com/aerokam/TaxationOfTr ... asuries.md. Footnotes handled nicely by GitHub.

I'm depending on knowledgeable forum members to review and critique.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			The document is more readable when viewing the rendered md, which you can see by clicking this link: https://github.com/aerokam/TaxationOfTr ... asuries.md. I recommend that folks view it this way, even if not making any edits.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: LadyGeek wrote: Fri Feb 20, 2026 2:55 pm]
LadyGeek wrote: Fri Feb 20, 2026 2:55 pm
Nice job. Is there any way you could add citations where appropriate? If you can have traceability to authoritative references, it can go in the wiki directly.
[/QUOTE]
The reference is this thread, so only citations that exist in the thread would be available. I can certainly have Claude search the thread for relevant citations, and can start a new fork for those edits. On my list.

All edits from now on will be via github, so if that works for the wiki someone can create that article.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

summary on github for editing
			I've put the taxation summary document on GitHub so we can manage edits and revisions properly. You don't need to know git to suggest edits.

Go to: https://github.com/aerokam/TaxationOfTreasuries
Click on TaxationOfTreasuries.md. You'll see a nicely formatted version of the doc. (Be sure to click the *.md file. The TaxationOfTreasuries.txt file shows the first version formatted for the forum.
Click the pencil icon (Edit) to the right, just above the doc. You'll see it in MD (markdown) format for editing, but click Preview to see the more readable version.
Make your edits in the text editor.
Before submitting, click Preview to verify your changes look correct — especially if you edited near any tables, bold/italic text, or horizontal dividers.
Scroll down to "Propose changes", add a brief description of what you changed and why
Click "Propose changes" — GitHub creates a branch and pull request automatically

A note on formatting: The document uses Markdown formatting. A few things to be careful about:

The quick reference table uses pipe characters ( | ) to define columns — try to avoid editing that section unless you're comfortable with it
Bold and italic text use asterisks (* and **) — don't accidentally add or delete one
Section dividers are three dashes (---) on their own line — don't delete them

I'll review all proposed edits before they're merged into the main document. This way we have a full history of every change and the reasoning behind it.

Note: I haven't been able to test the above steps as a non-owner, but this is standard GitHub behavior — let me know if you run into anything unexpected.

If you're not comfortable with that, just post your suggested edits as a reply here and I'll make the changes myself.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			Question posted in another thread:
[QUOTE: mmt wrote: Fri Feb 20, 2026 1:44 pm]
mmt wrote: Fri Feb 20, 2026 1:44 pm
I will take this one step at a time, starting with purchase confirmation.

1/15/25 purchase 100k 91282cml2  price 98.9514 total -99017.60 accrued interest 93.90  
     I can't get the math get from price + accrued interest to vanguard total??? 

statement 1/31/25  price 100,003.19  accrued int 99.77  remain bal 99972.00  jan factor .99972000  bal 99,972.00
     how did vanguard get the "price"?

later post to clear up how vanguard reported INT and OID and how that is reflected in their web statement
[/QUOTE]
Let's get the facts clear:

I will start by looking at historical Treasury prices for 1/15/25. Scroll to the end to see TIPS or just search for your cusip. I don't see it, so it must have been issued after 1/15/25, so I look at Treasury auctions (I download them into a spreadsheet), and I see that this was the 10y TIPS issued on 01/31/25 at a price of 98.951405 unadjusted, and 98.923699 adjusted. So you are quoting the unadjusted price, but you pay the adjusted price. Accrued interest per 1000 is 0.93897, which comes to 93.90 for 100.

So you pay the adjusted price / 100 * 100000 plus the accrued interest. Here are my calc results:

Code: Select allqty			100.00
face value		100,000.00
acc int per 1000	0.93897
acc int			93.90
adj price		98.923699
adj cost		98,923.70
total cost		99,017.60

Brokers get the price from a 3rd party source. It's probably stale, so won't reflect the actual bid price, which is what you'd pay if you sold, but it will be in the ballpark.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Summary of key points in thread
			Here's a summary I developed with Claude Sonnet 4.6. I asked it to read the thread and provide the summary requested by questionbox. I made some changes relative to the first iteration; e.g., discuss differences between how HRB and TT handle accrued market discount. Let's treat this as a first pass that we all can suggest changes or corrections to.

Note that the questions were about notes and bonds, so nothing about Bills is included. We probably want Bills covered to, since certain info can be provided only in a supplemental section of the composite 1099, and this requires some special handling.

Writing a Wiki article is too much work--I retired from that years ago, but happy to contribute thoughts if someone else wants to do it.

If we are able to get this into good enough shape, I'll post a link to the final version in the OP.

Please suggest edits to specific sections rather than editing the entire thing. I'm thinking of using git locally to manage this if there are significant inputs. Could use github, but I'm not super familiar with that, and many of you might not be either. Basic idea is for anyone who's interested to make edits, and my delegate(s) or I will decide whether or not to incorporate them.

I nominate FactualFran as my first delegate due to demonstrated ability to provide factually correct information related to this topic.

EDIT. I see from the forum rules about AI that I should post the prompts I used to create this, so here they are:

[QUOTE]
Read this thread: Taxation of Treasury bills, notes and bonds.
The next to last post in that thread requests a summary for specific questions. Here is the link to that post : viewtopic.php?p=8692378#p8692378.
Create the summary requested in that post.
[/QUOTE]
The first sentence was actually a link to this thread. I had to copy/paste the summary request, since for some reason the LLM could not read that specific post.

[QUOTE]
H&R Block and Turbtax handle accrued market discount reported on 1099-B in box f a bit differently. HRB requires creating a dummy 1099-INT to enter the AMD as interest. This is covered in the thread and should be discussed. Review thread again and make sure you're picking up differences in the way these 2 tax software programs handle things.
[/QUOTE]

[QUOTE]
great. now format this as a bogleheads.org post. put it in a code block that I can copy. Example: should useCode: Select all [list][/list] for unnumbered lists and Code: Select all[list=1][/list] for numbered lists.
[/QUOTE]

Then I had to do a minor edit to remove [hr] tags, which are not supported.

Although we should not yet treat the output as factually correct, a quick scan indicated to me that it was hitting the mark mostly. Our review and edits are required before we treat this as an accurate summary of the tax treatment for Treasuries.[/color]

--------------------------------------------------------------------------------------------------------------------

Mega-Summary: Taxation of T-Notes, T-Bonds, and TIPS in Taxable Accounts — All 6 Scenarios

This covers nominal Treasury notes/bonds and TIPS with coupons. T-bills are simpler and excluded. All Treasury interest is federally taxable at ordinary income rates and exempt from state/local tax. This summary addresses the 6 purchase/disposition scenarios that generate the bulk of annual tax questions here.

KEY CONCEPTS (DEFINITIONS)

Coupon interest — Semi-annual cash payments reported on 1099-INT Box 3. Always taxable in year received. State-exempt.

Accrued interest paid to seller — When you buy between coupon dates, you prepay the seller's earned-but-unpaid interest. Your 1099-INT will include this in Box 3, inflating your reported income. You must subtract it on Schedule B (labeled "Accrued Interest") in the year you receive the first coupon. Your broker notes it in the 1099 supplement but does NOT report it to the IRS — you must track it yourself.

Market discount — You paid less than face value on the secondary market (or a reopening), and the discount exceeds the de minimis threshold. Default treatment: tax deferred until disposal, then reported as ordinary interest income (not capital gain) via 1099-B Box 1f at time of disposal. Alternative election: accrue annually as interest income (see IRS Pub 550).

De minimis discount — Discount smaller than 0.25% × face value × years to maturity. Treated as capital gain at maturity, not ordinary income. Bonds bought at original auction typically have only a de minimis discount.

Market premium — You paid more than face value. Default: broker amortizes premium and reduces reported coupon interest annually via 1099-INT Box 12 for Treasuries. This reduces taxable interest each year; no capital loss at maturity.

Accrued market discount (AMD) — The portion of market discount accrued while you held the bond. Reported in 1099-B Box 1f upon disposal. Treated as ordinary interest income (not capital gain) on your federal return; enters on Schedule B. State tax treatment varies and is unsettled in many states — most states exempt it as Treasury interest, but consult your state's rules.

TIPS inflation adjustment (OID) — Annual increase in TIPS principal due to inflation is "phantom income" — taxable but not received in cash. Reported on 1099-OID Box 8. State-exempt.

THE 6 SCENARIOS

Scenario 1: Original Auction → Hold to Maturity (T-Notes/Bonds)

The simplest case. Finance Buff's recommended approach.

Each year: coupon interest on 1099-INT Box 3. Import and file. Done.
At auction, price is typically at a slight discount to par (de minimis). At maturity: tiny capital gain on 1099-B, or broker may fold it into Box 3. Either way, small amount.
Accrued interest at purchase: usually zero or negligible at original auction. If nonzero (uncommon), subtract from first coupon year's Schedule B.
No AMD, no market premium complications.
State return: Box 3 automatically excluded by most tax software.

Scenario 2: Reopening Auction → Hold to Maturity (T-Notes/Bonds)

Looks like buying at original auction but has complications. Reopenings are marked with "R" in Treasury's auction schedule.

The reopened bond has already been outstanding; you pay accrued interest to Treasury (same mechanics as secondary market accrued interest).
Your broker's 1099-INT Box 3 will include the full first coupon payment, which overstates your income by the accrued interest you paid.
Required action: In the year you receive your first coupon, subtract the accrued interest you paid on Schedule B. Your broker notes it in the 1099 supplement ("Taxable accrued Treasury interest paid") but does NOT report it to the IRS — you must track and enter it manually.
Subsequent years: normal coupon interest on 1099-INT Box 3.
Price may be at a premium or discount to par depending on rates. If discount > de minimis: AMD applies at maturity (see Scenario 5 below). If premium: broker amortizes via Box 12.
At maturity: any AMD in 1099-B Box 1f must be moved to Schedule B as interest income (see tax software section below).

Scenario 3: Original Auction → Sold on Secondary Market (T-Notes/Bonds)

Annual coupons: 1099-INT Box 3 each year held.
At sale: 1099-B reports proceeds. Since bought at original auction at/near par, discount is de minimis — any gain/loss on principal is capital gain/loss on Schedule D.
Accrued interest received from buyer at sale: reported on 1099-INT Box 3 in year of sale; state-exempt.
No AMD (de minimis discount treated as cap gain, not ordinary income).
TurboTax tip: Enter 1099-B entries one-by-one (not as sales summary) to properly handle any adjustments.

Scenario 4: Reopening Auction → Sold on Secondary Market (T-Notes/Bonds)

Same as Scenario 3 for annual coupons and accrued interest paid at purchase.
At sale: if you paid a significant premium, amortized premium has reduced your basis — broker adjusts. Capital gain/loss on the remaining principal difference.
If you paid a discount (bought below par at reopening): AMD accrued during holding period reported in 1099-B Box 1f at sale. Must be reported as ordinary interest on Schedule B (federal), not capital gain. Remaining gain/loss is capital.
On Form 8949: use Code D for AMD adjustment. Enter AMD from Box 1f as adjustment in column (g) to convert that portion from cap gain to interest. Also add AMD to Schedule B as "Accrued Market Discount."
State treatment of AMD: exempt in most states (same rationale as Treasury interest), but not universally settled. States like NY have active debate; states like MI explicitly exempt it. In states that exempt it, you must manually intervene in your tax software — most programs do not automatically transfer AMD to the state exclusion (see tax software section below).

Scenario 5: Secondary Market Purchase → Hold to Maturity (T-Notes/Bonds)

Most complex scenario for ongoing annual filing.

Year of purchase: you pay accrued interest to seller. Subtract from Schedule B in year first coupon is received.
Annual coupons: 1099-INT Box 3 each year.
If purchased at premium: broker amortizes via 1099-INT Box 12. Reduces taxable coupon interest each year. At maturity: no capital loss (basis has been stepped down by amortization).
If purchased at discount > de minimis: no annual AMD reporting under default method. AMD accumulates and is reported in 1099-B Box 1f only at maturity.
At maturity: 1099-B Box 1f shows total AMD. Report as ordinary interest on Schedule B. The 1099-B will show a capital gain equal to the AMD — you must use Code D on Form 8949 to reclassify it as interest (not cap gain). See tax software section below for how TT and HRB handle this differently.
If discount is de minimis: the small gain at maturity is capital gain, not ordinary income.
State return: coupon interest (Box 3) auto-excluded by most software. AMD requires manual intervention in most software.

Scenario 6: Secondary Market Purchase → Sold on Secondary Market (T-Notes/Bonds)

All of Scenario 5's complexity, plus capital gain/loss calculation.

Annual coupons, accrued interest paid, premium amortization: same as Scenario 5.
At sale: 1099-B shows proceeds and basis. AMD accrued to date of sale is in Box 1f.
AMD portion → ordinary interest income on Schedule B (Code D on Form 8949).
Remaining gain or loss above AMD → short-term or long-term capital gain/loss depending on holding period.
Accrued interest received from buyer at sale → 1099-INT Box 3.
State AMD uncertainty applies (same as Scenarios 4 and 5).

TIPS — ADDITIONAL LAYER (APPLIES TO ALL 6 SCENARIOS)

All of the above applies to TIPS, plus:

Annual inflation adjustment: reported on 1099-OID Box 8. Taxable as ordinary income federally; state-exempt. This is "phantom income" — you pay tax on it but don't receive cash (the adjustment accrues to principal).
Deflation year: if CPI falls, negative OID reduces your taxable income (shown as negative in Box 8 or as an adjustment). Cannot reduce below zero for the year.
At maturity: you receive the inflation-adjusted principal. No additional tax on the principal increase at that point — it was already taxed annually via OID.
Acquisition premium on TIPS (secondary market): if you paid more than inflation-adjusted par, that acquisition premium offsets OID each year. Broker tracks this; reported in 1099-OID Box 6.
TIPS bought at reopening auction: same accrued interest complications as nominal bonds, plus OID complications. Avoided by buying only at original TIPS auctions and holding to maturity.

WHERE THINGS GO — QUICK REFERENCE

Coupon interest → 1099-INT Box 3 → Schedule B; auto-excluded from state by most software
TIPS inflation adjustment → 1099-OID Box 8 → Schedule B; auto-excluded from state by most software
AMD at disposal → 1099-B Box 1f → Form 8949 (Code D) + Schedule B as interest; state exclusion requires manual intervention in most software
Capital gain/loss (non-AMD) → 1099-B → Schedule D
Accrued interest paid to seller → noted in 1099 supplement only (not IRS-reported) → Schedule B subtraction, entered manually by you
Premium amortization → 1099-INT Box 12 → reduces Box 3 interest on Schedule B

TAX SOFTWARE: HOW TURBOTAX AND H&R BLOCK HANDLE AMD DIFFERENTLY

This is where most annual confusion originates. Box 3 (coupon interest) and Box 8 (TIPS OID) flow correctly in both programs. AMD from 1099-B Box 1f is where they diverge.

TurboTax

Federal handling: Enter each 1099-B transaction one by one (not as a sales summary). When you enter Box 1f, TurboTax automatically:

Applies Code D on Form 8949, reducing the capital gain by the AMD amount
Carries the AMD to Schedule B as "Accrued Market Discount" — ordinary interest income

Critical: use one-by-one entry, not sales summary. If you enter as a sales summary total, TT may apply Code D but not carry AMD to Schedule B, causing underreporting of income. Summary-entry adjustments also trigger a requirement to mail a paper statement to the IRS.

State handling: Even when AMD is correctly moved to Schedule B federally, TurboTax typically does not automatically carry it to the state Treasury interest exclusion. For states like NY, entering the AMD amount with state code "NY" in the adjustment worksheet does not increase the US Government interest subtraction on the state return. A manual override of the state Treasury interest exclusion line is usually required, adding the AMD to the Box 3 total for state exclusion purposes. This override does not prevent e-filing.

H&R Block

Federal handling: When you enter the 1099-B with Box 1f AMD, HRB:

Subtracts the AMD from the capital gain on Form 8949 (Code D), netting gain to zero
Then warns you that the AMD must also be reported as interest income on a 1099-INT — but does not do this automatically

Required manual step — the "dummy 1099-INT": You must create a separate 1099-INT entry in HRB to report the AMD as interest income:

Create a new 1099-INT with a descriptive payer name such as "Fidelity Treasury Market Discount" (do not call it "Accrued Market Discount" — you didn't accrue it annually, you realized it at disposal)
Enter the AMD amount in Box 3 (US Treasury Obligations), NOT Box 1 — this is critical

Why Box 3 matters in HRB: entering in Box 3 of the dummy 1099-INT causes HRB to automatically treat it as state-exempt Treasury interest and carry it through to the state return correctly. If you enter in Box 1 instead, HRB will tax it at the state level. This is actually an advantage over TurboTax's approach — HRB's workaround, while manual, achieves the correct state result more reliably once you know the procedure.

HRB import caveat: if you import a Schwab (or other broker) consolidated 1099 into HRB, the Box 1f AMD may import but the description/memo field may be blank, which can cause capital gains on Schedule D to be overstated. Verify after import.

HRB-specific known bug — Bond Premium + Accrued Interest Paid: HRB has a longstanding bug (confirmed through at least tax year 2023): when a single 1099-INT has both bond premium amortization (Box 12) and accrued interest paid to seller requiring an adjustment, HRB cannot handle both adjustments on one 1099-INT entry. The workaround is to split the brokerage's 1099-INT into two dummy 1099-INTs, each handling one adjustment, with the Box 3 amounts split between them totaling the correct sum. The IRS matches totals, not individual 1099s, so this is acceptable.

FreeTaxUSA

For completeness: FreeTaxUSA reportedly handles AMD more automatically — it adds the AMD from Box 1f to Schedule B without requiring a dummy 1099-INT. Whether it correctly identifies it as Treasury interest for state exclusion purposes requires verification by the user.

Summary — AMD Handling by Software

Code D on Form 8949: All three programs handle this automatically
AMD → Schedule B as interest: TurboTax auto (one-by-one entry only); HRB requires dummy 1099-INT; FreeTaxUSA auto
State Treasury exemption for AMD: TurboTax requires manual override; HRB automatic if dummy 1099-INT uses Box 3; FreeTaxUSA — verify manually

Bottom line for filers:

TurboTax users: Enter 1099-B bond transactions one-by-one. Verify AMD appears on Schedule B. Then manually check/override your state return to include AMD in the Treasury interest exclusion.
H&R Block users: After entering the 1099-B with Box 1f, create a dummy 1099-INT with the AMD amount in Box 3. Verify your 1099-B import didn't leave the capital gain overstated.
Both: The IRS matches totals, not individual 1099 line items, so splitting entries across dummy 1099-INTs for mechanical reasons is acceptable and does not trigger issues.

THE FINANCE BUFF PRINCIPLE — WHY IT MATTERS

Scenario 1 (and its TIPS equivalent) is the only one requiring no manual adjustments and no AMD/state ambiguity. Everything flows cleanly from Box 3 and Box 8 of the 1099s with no intervention. Every step away from "original auction, hold to maturity" adds at least one manual adjustment: reopenings add accrued interest tracking; secondary market purchases add AMD and state complications; selling early adds AMD plus capital gain splitting. The complexity compounds when all three factors combine (Scenario 6). This is the practical basis for Finance Buff's advocacy of buying at original auction and holding to maturity.

CAVEATS

State treatment of AMD on Treasuries is unsettled in several states (notably NY). The dominant view is that AMD, being reclassified as Treasury interest income, should be state-exempt, but no definitive ruling exists in all states. See the extended discussion on NY in this thread and the linked NY-specific thread.
Tax software behavior can change year to year. Verify your software is handling AMD correctly before filing.
This is a summary of general principles. IRS Publication 550 is the authoritative source. Consult a tax professional for your specific situation.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: questionbox wrote: Fri Feb 20, 2026 10:48 am]
questionbox wrote: Fri Feb 20, 2026 10:48 am
It's that wonderful time of the year...tax time and another flood of questions and answers on taxation of T Note/Bonds and TIPS in taxable accounts, as distinguished by the flavors: 1) bought at originating auction and taxed upon maturation, 2) bought at reopening auction and taxed upon maturation, 3) bought at originating auction and sold and taxed upon secondary market sale, 4) bought at reopening auction and taxed upon secondary market sale, 5) bought on secondary market and taxed upon maturation or 6) bought and sold on secondary market.  Time for a clear summary of the practicalities of reporting annual coupon interest, accrued interest, accrued market discount (deminimus or not), market premium, capital gains vs loss, and all.  Where to plug the box 1f or each of the 1099-B numbers depending on the scenario?  Should all be summarized here --- or in a Wiki article?  Perhaps Finance Buff's advocacy of minimizing tax reporting headaches by buying at originating auction and holding to maturity can be understood against this flood of annual questions.  Maybe time for a mega-summary for the megathread, or a Wiki article, or a Finance Buff article specifically on taxation of TIPS and Notes/Bonds (coupon bearing Treasuries)?
[/QUOTE]
Yeah, that would be great. Let me see if one of the LLMs I use can read the thread and summarize the answer to the questions you mention.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: #Cruncher wrote: Mon Jan 12, 2026 8:53 amKevin M wrote: Sun Jan 11, 2026 12:16 am]
#Cruncher wrote: Mon Jan 12, 2026 8:53 am
Kevin M wrote: Sun Jan 11, 2026 12:16 am
... It would be nice to have #Cruncher chime in, to see if we can get a mathematical read on it.
I calculated the after-tax real return for two hypothetical TIPS maturing in 26 years:
[/QUOTE]
Thanks! Based on your calcs, it doesn't seem to make much difference whether AMD is taxed by the state or not.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Sat Jan 10, 2026 1:04 pm]
Jaylat wrote: Sat Jan 10, 2026 1:04 pm
Please check my logic on this: 

Even if the AMD is determined to be taxable in CA, the benefits of the deferred taxation of AMD (taxes on AMD are not paid until bond maturity) may outweigh the additional state taxation on a comparable bond bought at or closer to par. For example, here are two LT TIPS at the opposite end of the spectrum:

the 2052 TIPS has a 0.125% coupon and trades around $53.
the 2055 TIPS has a 2.375% coupon and trades around $94.

So, using very rough numbers, and depending on future inflation, approximately 50% of the return (YTM) from the 2052 is from AMD. The tax on this is due in 2052 - 26 years from now. The 2055 should have roughly the same return (YTM), but with taxes paid each year for the next 29 years. 

Nobody knows what California tax rates will be 26 years from now (what a dismal thought!), but let’s assume a 10% CA tax, well above what I’m currently paying. 

Would I pay an extra 10% to defer the payment of taxes each year for 26 years to a lump sum payment on the 26th year on a non-compounded basis? Absolutely! 

Given the above, I don’t see any reason to make trades in my TIPS portfolio from discounted to par bonds to avoid the potential for AMD taxes in California. Even if the CA taxes are imposed, discounted TIPS are still a better deal than non-discounted TIPS because of the tax deferral benefit. 

There might be other considerations, such as reducing the complexity of tax returns, to make the switch from discounted TIPS to TIPS bought at par. But doing it to avoid CA taxes which won’t be paid until more than two decades in the future seems not worthwhile.

Edit: I overstated the annual tax payments, which should be just for Federal tax, not the entire income. So the benefit is very much dependent on one's own marginal Fed and CA tax rates. While  not a no-brainer, I still reach the same basic conclusion, that the tax deferral significantly offsets any potential CA tax liability. And likely not worth it to completely restructure my TIPS portfolio to avoid AMD state tax.
[/QUOTE]
On first read, makes sense to me. It would be nice to have #Cruncher chime in, to see if we can get a mathematical read on it.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Sat Jan 10, 2026 11:25 pmApple314 wrote: Sat Jan 10, 2026 3:47 pm]
FactualFran wrote: Sat Jan 10, 2026 11:25 pm
Apple314 wrote: Sat Jan 10, 2026 3:47 pm
If I'm understanding correctly, for state tax purposes you're better off with the fund because it will report the amount of dividends it paid to you and tell you what percentage of those dividends are from US government obligations, but will not make any mention of AMD. Therefore you won't have the AMD issue you would have had with individual treasuries.

Is that correct?

Is there some countervailing issue that would make individual treasuries more attractive than a fund for tax purposes?

I have not had an AMD issue with individual Treasury obligations that I have owned.  The State income tax form starts with amounts from a Federal income tax return, including the interest amount (which can include AMD), and has lines for adjustments to be made to Federal adjusted gross income to calculate the State adjusted gross income.  Federal and State income tax laws treat some income differently, such as interest income from U.S. Government bonds.

Because I have not found anything at the State income tax web site specifically about AMD, I have included AMD from Treasury obligations in the U.S. Government interest adjustment on State income tax returns.  The State income tax web site indicates that with Treasury obligations, the interest is not taxable but the gain on sale is taxable.

I prefer individual Treasury obligations to a fund for income tax planning purposes.  With individual Treasury obligations I have an accurate estimate of the interest income for the year sooner than I would for a fund.
[/QUOTE]
Love it! That's the train I'm on.

If I were better organized, I'd just link to this post from now on.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			^So this would not work, even if I wanted to do it, for the taxable accounts in which TIPS were purchased before 2025, which is most of them. I guess a workaround would be to sell them, then buy them again?

It would be interesting to see an analysis of the tradeoff between losing the deferral of tax until maturity (with on state tax exemption), and making the OID election to possibly save on state income tax.

Still, I'd be very curious to see the details of the FTB's justification for the position they supposedly have taken on this. Doing a quick search, I found several links, including this one to a short audio summary: Spidell's California Minute: Understand how California treats accrued market discount income.

The only reference to regulations is to Internal Revenue Codes 1276 and 1278. I didn't hear any references to any CA regulations.

Toward the end they discuss the OID election, and mention that CA allows a separate election (that's a plus!), but it says that this only changes the timing, not the character, of the interest income. It's not crystal clear, but this seems to imply that it still would be taxed as ordinary income by CA.

Until something more definite happens, like getting an FTB Notice of Proposed Assessment (NPA), I'll continue my current practice. I don't see how I would be expected to rely on tax advice from a newsletter I don't even have access to, and that's intended for tax professionals.

Looking at a couple of 1099s for 2024 for accounts with TIPS in taxable, I see that the AMD was significant compared to the interest and OID (inflation adjustment income), but on the other hand, the additional assessment would be small in the grand scheme. So mainly this lowers the taxable equivalent yield (TEY, or if you prefer, after-tax yield) of TIPS held in taxable at bit.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Fri Jan 09, 2026 3:17 pmKevin M wrote: Fri Jan 09, 2026 2:10 pm]
FactualFran wrote: Fri Jan 09, 2026 3:17 pm
Kevin M wrote: Fri Jan 09, 2026 2:10 pm
[Thanks for the reminder. I don't hold any TIPS in taxable at Schwab, but accounts I manage at Fidelity do, and they had TIPS mature in 2025, so I'll check this out when we get the tax forms in Feb.

I was disappointed to see that Schwab did it wrong again in 2024, according to #Cruncher.

I had TIPS in a taxable account at Fidelity that matured in 2024.  The Cost or Other Basis on the Form 1099-B from Fidelity correctly included the inflation adjustments to the principal that had been made since purchase.  The Accrued Market Discount on the 1099-B was the expected amount: the principal at settlement minus the price paid for the principal.
[/QUOTE]
That's great news! I'll probably check it myself this tax season. Or I might just look at 2024, since there are Fidelity accounts I manage that had TIPS mature in 2024.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Fri Jan 09, 2026 3:30 pm]
FactualFran wrote: Fri Jan 09, 2026 3:30 pm
That prompts a question: what if a taxpayer elects on a Federal income tax return to treat all interest as OID?  Market discount would be included in the interest treated as OID.
[/QUOTE]
Interesting! Here is a link to the relevant CFR: 26 CFR § 1.1272-3 - Election by a holder to treat all interest on a debt instrument as OID. | Electronic Code of Federal Regulations (e-CFR) | US Law | LII / Legal Information Institute

I'd have to research this more to understand it, but don't you need to then pay tax on the AMD, treated as OID, annually, as you would for STRIPS? The negative impact on Fed taxes (not deferring tax on the AMD until maturity) might be worse this way than the benefit for state taxes. And can you do this if you didn't make this election in the first year you would have paid income tax on the "OID", and if so, how does that work?

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			I'd think the CA FTB would be swamped if they started issuing correction notices for everyone who's treating Treasury AMD as Treasury interest. Did the Spidell research mention any of those tax professionals receiving correction notices if they did this?

Given my experience with FTB on the muni bond ABP thing, it's likely to take a year or two from the issuance of a correction notice to a resolution of a challenge.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Thu Jan 08, 2026 7:36 pmKevin M wrote: Thu Jan 08, 2026 2:25 pm]
Jaylat wrote: Thu Jan 08, 2026 7:36 pm
Kevin M wrote: Thu Jan 08, 2026 2:25 pm
Aren't these folks not supposed to give tax advice? I wouldn't take tax advice from a fixed income specialist or anyone else at a broker. 

Agreed. I was posting this more as a warning to unsuspecting clients who might blindly follow their advice. And also to check if there's been any updated take on CA taxation, which it appears is not the case. I suspect that Schwab is just being overly careful to err on the side of caution. 

That said, I'm taking another look at my TIPS held in taxable. It might be prudent to swap out deep discount bonds for ones trading closer to par?
[/QUOTE]
Good thought. No can do if someone wants to hold a TIPS ladder with maturities beyond 2041, as most of those are pretty deeply discounted (if you consider somethign in the 70s deeply discounted.)

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			Oh, and other than TIPS, I've only been buying Bills for the last year or so. I still hold some notes and bonds purchased before I switched to Bills only. I didn't switch for tax reasons, but because I didn't want to end up buying Treasuries that mature on the weekend, which is never the case for Bills, and also because I am sticking to maturities of less than a year anyway for non-TIPS Treasuries.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Artsdoctor wrote: Fri Jan 09, 2026 12:08 pmJaylat wrote: Thu Jan 08, 2026 10:42 pm]
Artsdoctor wrote: Fri Jan 09, 2026 12:08 pm
Jaylat wrote: Thu Jan 08, 2026 10:42 pm
Thanks, please let us know what he says.

Let me share some information I found online.  I'll preface this by saying that I'm not a tax attorney.

In late 2024, Spidell's California Tax Newsletter published an article about the CA FTB's response to a question Spidell submitted to them regarding tax treatment of accrued market discount of US treasury securities.  Spidell is well-regarded by tax professionals and publishes a newsletter which is not legally binding but offers interpretations of state tax rules and regulations.  They had evidently received multiple requests regarding clarification of how CA handled AMD so sought clarification from the FTB directly since there was so much confusion among tax professionals; this article evidently ran in their late 2024 newsletter but it's behind a paywall.  Spidell claims that the CA FTB treats coupons and OIDs of treasury obligations as interest income which is exempt for state taxation; the state does not consider AMD as exempt from state taxation.  Furthermore, the state does not differentiate AMD from a purchase on the secondary market or from a reopening at auction.

Although I don't have access to the formal newsletter, I did find a YouTube video by Spidell from October 2024 entitled "Understand how California treats accrued market discount income."  It's only 4 minutes and you can see it here:

https://www.youtube.com/watch?v=Uwz5lr7ClD4
[/QUOTE]
I just don't see how this makes sense, but I guess tax regulations don't need to make sense.

Consider a note or bond with a low coupon compared to a zero-coupon STRIPS with a similar maturity. Example, there is a note maturing 9/30/27 with a 0.375% coupon and 3.53% yield today, and there are STRIPS maturing 11/15/27, the stripped interest version with a yield of 3.54%. Most of the return for the former comes from accrued market discount (AMD), while all of the return for the latter really comes from the same, but it's considered OID for tax purposes. So according to Spidell's account, which I have no reason to doubt, the AMD for the note would be taxed, but not that for the STRIPS. No comprendo.

At any rate, as I said, I'll continue to treat Treasury AMD as Treasury interest for state income tax purposes in CA unless I get a correction notice from FTB. I would challenge that, but probably would switch any related tax reporting. Hopefully any CA participants in this thread who get a CA FTB correction notice for this will also share with us.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Fri Jan 09, 2026 6:50 am]
cas wrote: Fri Jan 09, 2026 6:50 am
As a head's up, on a different TIPS tax topic than AMD, are you familiar with this 10-years-and-running thread from #Cruncher?

Schwab 1099 Problems for Maturing TIPS

(Someone getting taxed twice on all OID incurred over the years, because they assume the brokerage got the tax reporting right, could be ugly.    However, I'm not picking on Schwab in particular.  There is a thread in existence documenting quirks (some of them large) in tax reporting of TIPS at all the major brokerages.   And if you ever have to settle an estate, the "settling estate" side of the IRS appears pretty weak in their knowledge of bonds in general and TIPS in particular.   As does the software used by estate attorneys to determine basis of individual bonds after a death. )
[/QUOTE]
Thanks for the reminder. I don't hold any TIPS in taxable at Schwab, but accounts I manage at Fidelity do, and they had TIPS mature in 2025, so I'll check this out when we get the tax forms in Feb.

I was disappointed to see that Schwab did it wrong again in 2024, according to #Cruncher.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Wed Jan 07, 2026 6:33 pmArtsdoctor wrote: Mon Mar 17, 2025 3:02 pm]
Jaylat wrote: Wed Jan 07, 2026 6:33 pm
Artsdoctor wrote: Mon Mar 17, 2025 3:02 pm
I spoke with the CA FTB years ago about this and then asked my CPA how he handles this.  CA conforms with federal interpretation:  AMD is interest which is not taxed at the state level.  Capital gains at the federal level are capital gains at the state level.  CA is pretty straightforward on this--other states appear to be silent but the default is probably the same unless there are tax laws to the contrary.

You adjust for this on your California Schedule CA.  However, our taxes are always formally filed by the accountant so I can't tell you exactly how to enter this on your TurboTax software to make sure it's correct.  I know that sometimes posters in NY have remarked that the workaround wasn't all that straightforward so just double-check whenever you think you've finished to make sure it's correct.

Resurrecting this old post about California taxation of Accrued Market Discount on T-Notes. Here's the summary quote: "CA conforms with federal interpretation:  AMD is interest which is not taxed at the state level."

I just spoke with a Schwab fixed income specialist who swore up and down that the accreted discount on a treasury note is indeed taxable in California. "I tell that to clients every single day. It's a big part of what I do." 

Thinking he might be an anomaly, I called back and spoke to a different Schwab fixed income rep, who told me the exact same thing. They both were very convinced that it was common knowledge that Accrued Market Discount on T-Notes is subject to California taxes.
[/QUOTE]
Aren't these folks not supposed to give tax advice? I wouldn't take tax advice from a fixed income specialist or anyone else at a broker. These are the same type of folks who we've seen advise against owning TIPS for reasons like the yields are too low. If you want to call Schwab again, please ask whoever tells you this to cite an IRS or FTB reference that we can all read.

I will continue to report AMD as Treasury interest, as I have been doing. I do this on multiple tax returns, so I'll let everyone know if I ever get a correction notice from the IRS, and if so, whether or not I am able to successfully challenge it.

On a related note, I got a correction notice from the FTB indicating I owed more tax on interest from a bunch of muni bonds I had held. The difference between my calculations and theirs was that I had deducted the amortized bond premium (ABP) and they had not. I paid the assessment and submitted my objection and calculations, but didn't hear back from them for many months--like maybe a year. Finally someone from FTB called me, and said the files I uploaded were garbled. I asked her if she understood ABP, and she said of course, and just asked me to upload the broker statements that showed the ABP. I did that while on the phone, and those were garbled too, so she sent me a link that enabled me to upload the files. Quite a few months later I finally received the notice that reversed their assessment, along with a check for the assessment amount plus interest.

Moral: don't hesitate to challenge something like this, and understand that it can take a long time to get it resolved.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: michaeljc70 wrote: Mon May 12, 2025 1:29 pm]
michaeljc70 wrote: Mon May 12, 2025 1:29 pm
I bought a 10 year treasury on the secondary market last year.  I paid $260 accrued interest.  My 1099-INT shows $1650 in interest paid to me which I  received and reported.  I guess I could have deducted the $260 on my tax return from the interest?   Not worth amending for...or maybe bothering with...but if in the future it is larger amounts I want to be sure.
[/QUOTE]

Yes, you should have deducted the accrued interest; that would appear on Schedule B as a negative amount.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: sycamore wrote: Mon May 12, 2025 11:59 amphositadc wrote: Mon May 12, 2025 11:16 am]
sycamore wrote: Mon May 12, 2025 11:59 am
phositadc wrote: Mon May 12, 2025 11:16 am
If I buy TIPS on the secondary market with Vanguard, is the 1099 that Vanguard will send me each year basically plug and play?  I.e., it will account for both the coupon and the inflation adjustment, and I won't have to do any extra calculations myself?  Basically just import it into Turbotax and I'm done?

I tried to do a search of this massive thread but didn't quite find what I was looking for.

Read this post by cas about accrued interest: viewtopic.php?p=6968284#p6968284.

Briefly, when you bought your TIPS you paid for not just the bond but also the accrued interest due to the seller up to that date.
That accrued interest is taxable to the seller, not you, but the total coupon payment is reported to you nevertheless on the 1099-INT.
You'll want to adjust your tax return so you're not taxed on that accrued interest.
[/QUOTE]

Other than accrued interest paid to seller, which is a factor for any Treasury with a coupon (i.e., nominals as well as TIPS), yes, the consolidated 1099 you get will show the coupon interest on 1099-INT, and the inflation adjustment income on 1099-OID, both of which you should be able to import into TT (I use HRB, and it was no problem).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: gavinsiu wrote: Sun Apr 06, 2025 7:38 am]
gavinsiu wrote: Sun Apr 06, 2025 7:38 am
On Tipswatch, the recommendation was to buy near the end of April for ibond? Why wait until that time period?
[/QUOTE]
This question is not related to taxation of Treasury bills, notes and bonds, so is not a topic for this thread. I recommend that you start your own thread with this question, or post it in one of the many I Bond threads (search on I Bonds in the form search box).

Note that although "TIPS" is in the name of the TIPSwatch blog, the author also covers I Bonds, which are not TIPS, but are inflation indexed savings bonds. Even if you had an I Bond tax question, this would not be the thread in which to ask it. From the OP of this thread:
[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Note that series I and E savings bonds are not marketable Treasuries, so taxation of these is not a topic for this thread.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: TOM1964 wrote: Tue Mar 18, 2025 12:14 pmArtsdoctor wrote: Mon Mar 17, 2025 3:02 pm]
TOM1964 wrote: Tue Mar 18, 2025 12:14 pm
Artsdoctor wrote: Mon Mar 17, 2025 3:02 pm

I spoke with the CA FTB years ago about this and then asked my CPA how he handles this.  CA conforms with federal interpretation:  AMD is interest which is not taxed at the state level.  Capital gains at the federal level are capital gains at the state level.  CA is pretty straightforward on this--other states appear to be silent but the default is probably the same unless there are tax laws to the contrary.

In Vermont, the law reads:

 "Income from United States government obligations does not include income from the
following:
-- Gains from the sale or exchange of such obligations."

Does this sound like AMD is taxed? The tax letter that governs the issue does not specifically say. I just downloaded my 1099 straight from Schwab and did not modify it for my Vermont return. I'm wondering if I overpaid, but I can't make it through all 27 pages of this thread.

Cheers, T

https://tax.vermont.gov/sites/tax/files ... 202014.pdf
[/QUOTE]

No, it does not sound like Treasury AMD is taxed, since AMD is not treated as a capital gain, but as interest income. What would be taxed was anything that was left after the AMD adjustment.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: sorka wrote: Mon Mar 17, 2025 7:21 pmKevin M wrote: Mon Mar 17, 2025 3:59 pm]
sorka wrote: Mon Mar 17, 2025 7:21 pm
Kevin M wrote: Mon Mar 17, 2025 3:59 pm

I use HRB, and with that we need to enter the AMD adjustment amount in a dummy 1099-INT, so I put it in box 3 to ensure it is included in subtractions on CA Form 540.

In HRB there is a Schedule CA (540) mini-worksheet for Taxable Interest Income Subtractions. Line a shows US Treasury Interest, and line b allows an entry for Other Subtractions non included in line a, and this is where I'd enter the AMD interest adjustment. Line c is the total of a + b, and is entered in Column B (subtractions) of Line 2 Taxable Interest Income.

If the TT worksheet entry you mention affects the subtraction amount on Line 2 of Schedule CA, then that's what I'd use.

Thanks for the reply. If I use a dummy 1099-INT to report the 1099-B 1f AMD as interest instead, it all flows to the 540 worksheets. I've seen some who said this is how they handled it. My preference would be for this as it doesn't change the federal amount and the adjustment is done before it transfers to CA which means not having to override anything on the CA return. However, it does mean reporting more box 3 interest than what is actually reported to the feds and removing the Code D amounts in the Capital Gain (Loss) Adjustment Worksheet(s) for each of the transactions that were added to box 1f otherwise you get double taxed on that interest. I can't see any other way to make this adjustment. 

If I do it on the CA side instead, it's just a single entry on line 12 column b of the Interest and Dividend Adjustments Worksheet which I labeled "AMD Adjustment Fed Obligations Held to Maturity". 

However, not really sure if that's going to fly with the FTB.
[/QUOTE]

I would be fine with it. 

I recently had a gratifying experience with the FTB, and although it was related to munis rather than Treasuries, it was a similar type of issue. In 2019 I was invested in a bunch of munis, including many non-CA munis. I included the amortized bond premium (ABP) as a subtraction from non-CA muni interest income for CA tax purposes. Early last year I received an FTB assessment for additional taxes on the ABP amount, and I submitted a dispute for it. Early this year (yeah, it took about a year) I received a call from a very nice woman at the FTB regarding my dispute. The first question I asked her was whether or not she understood amortized bond premiums, and she immediately replied that she did; I was impressed. She said that she just needed the 1099s showing the ABP, and a few weeks after I provided those to her, they reversed the assessment for additional taxes.

As a side note, the FTB upload capability did not work to submit the 1099s. It appeared to work on my end, but on her end she saw nothing or something that was unreadable, so she sent me an email that I replied to with the attachments, and that worked. She stayed on the line as we worked through all of this, until she received the documents.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: sorka wrote: Sun Mar 16, 2025 10:16 pm]
sorka wrote: Sun Mar 16, 2025 10:16 pm
I had several t-notes that matured last year. Box 3 of my 1099-Int had the interest payments for these notes. Box 1f had AMD which included the entire difference between face value and the price paid rather than OID - price paid.

The first question: is the AMD taxable in CA even though the IRS treated this as interest on my federal taxes? In the end, this 1f amount did not make it into the column b exclusions on the CA Interest and Dividend Adjustments Worksheet Line 1 and did not appear on any line. 

Again, the 1f amount is still considered interest 8949 with a code D. These notes were held to maturity.

Secondly, if should not be considered taxable by California, where should the correction be made? I've seen TT Employee tax experts in the intuit form state that you should transfer the 1f amount to the Box 3 in the 1099 but that would result in stating a different box 3 amount than the feds get on their copy even though it doesn't change the federal tax. 

Others claimed they did an AMD adjustment on Line 12 of the CA Interest and Dividend Adjustments Worksheet.
[/QUOTE]

I use HRB, and with that we need to enter the AMD adjustment amount in a dummy 1099-INT, so I put it in box 3 to ensure it is included in subtractions on CA Form 540.

In HRB there is a Schedule CA (540) mini-worksheet for Taxable Interest Income Subtractions. Line a shows US Treasury Interest, and line b allows an entry for Other Subtractions non included in line a, and this is where I'd enter the AMD interest adjustment. Line c is the total of a + b, and is entered in Column B (subtractions) of Line 2 Taxable Interest Income.

If the TT worksheet entry you mention affects the subtraction amount on Line 2 of Schedule CA, then that's what I'd use.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: WalkingBackToHouston wrote: Wed Mar 12, 2025 4:12 pmKevin M wrote: Wed Mar 12, 2025 1:57 pm]
WalkingBackToHouston wrote: Wed Mar 12, 2025 4:12 pm
Kevin M wrote: Wed Mar 12, 2025 1:57 pm

Yes, this looks right.

With tax software, the values in the 8949s automatically flow to Schedule D (at least that's the way it works with HRB and TurboTax). Tax software may or may not automatically make the appropriate subtraction on Schedule B.

I see this as an important thread. Thanks for starting it. Perhaps it should be sticky?
And thanks to all contributors here. I have added a couple of checkpoints to my taxes every year.
[/QUOTE]

Glad you're finding it useful. I don't know what the process is to make a thread sticky, but you could always PM a moderator and ask.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: WalkingBackToHouston wrote: Wed Mar 12, 2025 10:10 amginahoy wrote: Tue Mar 11, 2025 1:06 pm]
WalkingBackToHouston wrote: Wed Mar 12, 2025 10:10 am
ginahoy wrote: Tue Mar 11, 2025 1:06 pm
Your first question is rather basic... I can't imagine an experienced CPA would miss that, but question 2 has multiple moving parts. 

Rather than questioning your CPA in advance, I recommend waiting until he gives you your completed returns to sign. Request to receive via email so you can review at your leisure without pretense. Then check your Sch B and 8949's and post specific questions here. Hopefully your returns will be ready well ahead of the filing deadline 

so here is what he did.  I anonymized the actual numbers. Does this look right?

Starting with a 1099-B that reports 
	$500 in totals row for column 1f (AMD) for Box A Short Term Capital Gains Treasury notes
	$500 in totals row for column 1f (AMD) for Box D Long Term Capital Gains Treasury notes

First he adjusts the long and short term capital gains to take out the AMD
	Form 8949 Part 1 (A checked) row 2 (totals) column (g) ($500)
	Form 8949 Part 2 (D checked) row 2 (totals) column (g) ($500)

Then he moves the AMD capital gains offsets from above to schedule D
	Schedule D Part 1 row 1b column (g)  ($500)
	Schedule D Part 2 row 8b column (g)  ($500)

Finally he reports the AMD as interest on Schedule B Part 1 Interest
        [Name of Brokerage] Accrued Discount   $1,000
[/QUOTE]

Yes, this looks right.

With tax software, the values in the 8949s automatically flow to Schedule D (at least that's the way it works with HRB and TurboTax). Tax software may or may not automatically make the appropriate subtraction on Schedule B.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			I wouldn't be surprised if a CPA just enters all accrued interest paid to seller included on the composite 1099 as a subtraction on Schedule B. That's what I do, and that's what the CPA I used one year did. It's not exactly right, but I personally don't expect to get a correction notice for it. The only times I haven't done this is when there wasn't enough interest paid to cover the accrued interest subtraction, in which cases I kept track of the amount to subtract the following year in my tax spreadsheets.

If the CPA is following the IRS regs to the letter, they should keep track of whatever interest they don't deduct in the first year and include it in the accrued interest subtraction on Schedule B the next year.

You will see a negative number entry on Schedule B for accrued interest, which is a quick way to check that the CPA at least did something about it. You can check it against the info in your composite 1099s if you want to verify it.

All the big three brokers include accrued interest on the composite/consolidated 1099 in a section of info not reported to the IRS. For 2023, Vanguard included it directly in the interest details section, and showed the total accrued interest paid directly under the Total Interest. Fidelity and Schwab include accrued interest in a separate section.

Similarly, you should see total AMD adjustment amounts in column g on Schedule D, in the long-term and short-term sections if you had both long term and short term adjustments on the 1099-B, and you should see an interest entry on Schedule B for the total adjustment amount (I enter one Schedule B item for the sum of short-term and long-term AMD adjustments, which as I said, I enter into Box 3 on a dummy 1099-INT).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: WalkingBackToHouston wrote: Mon Mar 10, 2025 7:43 pm]
WalkingBackToHouston wrote: Mon Mar 10, 2025 7:43 pm
I have a matured discounted treasury showing up on my 1099B as a long term gain.  I did hold it more than 1 year, but I thought the discount was taxed at ordinary income rates when the bond matures.
What am I missing or misunderstanding?
Thank you.

EDIT: I think I see what's going on. It shows up as accrued market discount and that will get shown as interest on the return.  Why does the 1099B separate long term and short term accrued market discount?  They are both taxed the same (interest), right?
[/QUOTE]

Depending on the tax software you use, you may need to add a dummy 1099-INT to get the AMD to show up on Schedule B. I put it into Box 3 for Treasuries, so it is subtracted from income for state income taxes.

Different form 8949s are used for short term and long term gain, which is why they're shown in different sections of the 1099-B. Note the instructions for each section about which box to check. But yeah, the AMD ends up being taxed as interest in both cases.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: WalkingBackToHouston wrote: Mon Mar 10, 2025 2:54 pm]
WalkingBackToHouston wrote: Mon Mar 10, 2025 2:54 pm
sorry to be a bit lazy . . . but before I spend a week reading through this mega thread:

Assuming no state tax:
Assuming all done through major brokerage (Schwab, Fidelity, Vanguard, etc)
Assuming no TIPS
Assuming I always hold to maturity

1) If I buy Treasuries on the secondary market are there some extra steps that should be doing regarding post processing the 1099 reported values before they go into tax prep software?  

2) Or can I safely assume my CPA is just plugging the 1099 values into his professional software and everything is getting handled correctly because all the details are being handled automatically by the software?

If Yes to #1 and No to #2 I'll start reading
[/QUOTE]

1. The 1099s go into tax prep software as is, for example if you download directly from the broker. There may be some additional steps you must know how to do for notes/bonds, but bills are straightforward. See the OP for a quick summary, and search on "accrued market discount", "accrued interest", and "amortized bond premium" for more.

2. It depends on the CPA. Based on personal experience and some things I've seen posted here, I would not trust a CPA to handle notes/bonds correctly.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MnD wrote: Fri Mar 07, 2025 6:03 pmKevin M wrote: Fri Mar 07, 2025 4:41 pm]
MnD wrote: Fri Mar 07, 2025 6:03 pm
Kevin M wrote: Fri Mar 07, 2025 4:41 pm

Your cost basis should have been adjusted by the amount of interest reported on 1099-INT for the ones you sold before maturity, so the $144 should be for actual capital gains. You can verify this by comparing what you actually paid (see your transaction history) to what is reported as basis. This is handled in the "Sale of Collectibles and Other Investment Property" section, under "Sales and Other Transfers". If you go to that interview section, you should see the sale that was imported from Schwab, and you can check the basis there.

I had the same situation, and although I don't recall checking the basis, the interest reported was was about $300 and the gain was about $73, so clearly my basis was adjusted to compute the capital gain, since all Tbill interest comes from the accrual of acquisition discount (there is no coupon interest).

Please let us know if you are able to verify all of this.

Nope. For the three I sold early the actual purchase price matches the cost basis and adjusted cost basis on the back section of the Schwab 1099 and what flowed over to form 8949.  Same as what I paid at auction in my transactions log.

 As a cross check the 1099-INT amount corresponds to the penny to the gains on the ones I bought at auction and held to maturity. The account held only T-bills and SWVXX so it was pretty easy to cross-check. 

These 8 bills are all 3-month t-bills and the ones sold early were on average a month from maturity so the gain is virtually all interest but documented by Schwab as 100% short-term cap gains.

p.s. Thanks for the response and all your contributions to this thread.
[/QUOTE]

[QUOTE: ginahoy wrote: Fri Mar 07, 2025 7:34 pmMnD wrote: Fri Mar 07, 2025 4:01 pm]
ginahoy wrote: Fri Mar 07, 2025 7:34 pm
MnD wrote: Fri Mar 07, 2025 4:01 pmMy Schwab consolidated 1099 lists the gain on the 5 bills matured as interest on US obligations on line 3 1099-INT. None of the gains on the three bills sold early were included in this amount.

I had the exact same situation on my '23 return and started a separate thread to find out if Schwab might have made an error, or if not, why not... viewtopic.php?t=425508

Turns out it wasn't an error. FactualFran addressed the 'why' part in an early post in this megathread: viewtopic.php?p=6973621#p6973621

But I still don't understand why the IRS doesn't require brokers to report these sales or at least cover this situation in the 8949 instructions.
[/QUOTE]

Ah yes, it's been so long since I dealt with this that I had forgotten. The source of my confusion for 2024 was that I bought two lots CUSIP 912797GX9, one of which matured, and one of which I sold before maturity. So here's my actual situation, and how I'll handle reporting for the one sold before maturity.

The indicated CUSIP appears exactly twice in my Schwab 1099 composite, once in the interest details section, and once in the Short-Term Realized Gain or (Loss) section not reported on 1099-B or to the IRS. The entry in the interest details is for the lot I held to maturity, so included in the 1099-INT box 3 amount. The entry in the supplemental section is for the lot I sold before maturity. So the same lot is not reported on both 1099-INT and in the supplemental section.

Pub 550 seems clear as to how interest on short-term Treasury obligations is to be reported:
[QUOTE]
Short-term government obligations.

Treat gains on short-term federal, state, or local government obligations (other than tax-exempt obligations) as ordinary income up to your ratable share of the acquisition discount. This treatment applies to obligations with a fixed maturity date of not more than 1 year from the date of issue. Acquisition discount is the stated redemption price at maturity minus your basis in the obligation.
[/QUOTE]

I calculate the ratable share is the prorated portion of the interest for my holding period, relative to the acquisition discount (interest that would have been earned if held to maturity). Turns out that this is within $0.03 of the gain shown in the supplemental section.

I could either adjust the basis in the "Tell us about this sale" screen, or I could enter the accrued interest as accrued market discount. I choose to do the latter, even though for Tbills it's accrued acquisition discount. I add a dummy 1099-INT and enter the accrued acquisition discount (ratable share) in Box 3, which will result in it being correctly reported as USGO interest, and in it being subtracted from my state income.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MnD wrote: Fri Mar 07, 2025 4:01 pm]
MnD wrote: Fri Mar 07, 2025 4:01 pm
I have searched and read numerous of the entries in this thread but am still confused. 

I purchased eight T-bills at auction at various times in 2024. 
Five  matured and I sold 3 early on the secondary market in 2024. 

My Schwab consolidated 1099 lists the gain on the 5 bills matured as interest on US obligations on line 3 1099-INT. 
None of the gains on the three bills sold early were included in this amount. 

For the three bills sold early the gains ($144) were reported in Schwab consolidated 1099 in "year end summary information" as short term realized gains not reported on form 1099-B to the IRS. "Report on Form 8949 in Part 1 with Box C checked. 
Sure enough, when the 1099 was imported into H&R Block software it flowed to Form 8949 Part 1 with block C checked. 

On my federal return there is no difference in taxes owed due to this classification. I have no offsetting capital losses, so the short term gains were taxed the same as interest. 

On my state return the result is an additional $7 in tax owed due to the $144 not flowing over to the state return as US government interest. 

Unless convinced otherwise I'm planning to just let this ride because I do not not want to muck anything up by creating "dummy" 1099-INT interest forms or overriding anything in the federal or state tax software inputs. Saving $7 would not justify a mucked up return, rejection of e-file, notices after filing  etc. 

Thoughts?
[/QUOTE]

Your cost basis should have been adjusted by the amount of interest reported on 1099-INT for the ones you sold before maturity, so the $144 should be for actual capital gains. You can verify this by comparing what you actually paid (see your transaction history) to what is reported as basis. This is handled in the "Sale of Collectibles and Other Investment Property" section, under "Sales and Other Transfers". If you go to that interview section, you should see the sale that was imported from Schwab, and you can check the basis there.

I had the same situation, and although I don't recall checking the basis, the interest reported was was about $300 and the gain was about $73, so clearly my basis was adjusted to compute the capital gain, since all Tbill interest comes from the accrual of acquisition discount (there is no coupon interest).

Please let us know if you are able to verify all of this.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Electron wrote: Fri Mar 07, 2025 2:38 pm]
Electron wrote: Fri Mar 07, 2025 2:38 pm
Thanks very much Kevin and ofckrupke. 

I did'nt know that the de minimis rule also applied to Treasury securities. I'll be happy to pay the capital gains tax and avoid a call to Vanguard.

This will be a little work as I will need to update several Federal and State tax forms to incorporate the change. I'm glad I learned about this before mailing in the returns.

I see that the de minimis rule is covered in IRS Publication 550.
[/QUOTE]

Yeah, I had to check this for myself, as it hasn't applied to any of the returns I've prepared--at least not for 2024. Sure enough, it is covered in the Market Discount section of Pub 550:

[QUOTE]
Market discount.

Market discount is the amount of the stated redemption price of a bond at maturity that is more than your basis in the bond immediately after you acquire it. You treat market discount as zero if it is less than one-fourth of 1% (0.0025) of the stated redemption price of the bond multiplied by the number of full years to maturity (after you acquire the bond).
[/QUOTE]

However, we should clarify that market discount is not the same as OID, so we're talking about a discount that arises after a bond's issue date (so "market discount" doesn't apply to auctions of new issues, even though the same de minimis rule applies):

[QUOTE]
Market discount arises when the value of a debt obligation decreases after its issue date. Generally, this is due to an increase in interest rates. If you buy a bond on the secondary market, it may have market discount.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Electron wrote: Fri Mar 07, 2025 1:20 pm]
Electron wrote: Fri Mar 07, 2025 1:20 pm
I have a 2024 Vanguard 1099-B entry that looks incorrect.

In 2022, I purchased $20,000 of Treasury Note 91282CEK3 at auction. The principal was $19,967.12 and the accrued interest paid was $2.72. The total cost was $19,969.84.

Line 1f of the 1099-B shows $0.00 for the Accrued Market Discount (D). The Gain or Loss entry shows $32.88. Cost basis on Line 1e correctly shows $19,967.12. The Additional Information column shows Redemption (note 25) and Original basis $19,967.12.

I am filing a paper return and was expecting to make an adjustment of -$32.88 with Code D on IRS Form 8949. Does anyone have a suggestion on how to proceed?

In the first half of 2022 I purchased two Treasury Notes in the secondary market that matured the same year. The 1099-B correctly showed the Accrued Market Discount on Line 1f with Code D. The Gain or Loss entries were $0.00.
[/QUOTE]

I can think of three alternatives:

Report it as shown on the 1099-B. This appears to be incorrect, but the impact to your tax is minimal, and it will be consistent with the 1099-B that the IRS receives.
Request that Vanguard issue a corrected 1099-B with the correct AMD, or they can explain why the AMD isn't reported as expected. A hassle, but perhaps the "correct" way to do it. I had to request a corrected 1099 from a credit union one year, but the financial impact was huge, so it was necessary.
Report it on your tax return in the way you believe is correct. I doubt this will trigger a correction notice from the IRS, but who knows for sure.

Note that, as I shared, the 1099-B data imported into HRB from Schwab and Fidelity did not include the AMD amounts in box 1f, but the PDF 1099-Bs did. I don't know which version the IRS will receive, but I did the AMD adjustments per the PDF version, which required me to add the box 1f values into the HRB 1099-B forms.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: p1db wrote: Thu Feb 27, 2025 6:59 pmcalvin111 wrote: Thu Feb 27, 2025 5:23 pm]
p1db wrote: Thu Feb 27, 2025 6:59 pm
calvin111 wrote: Thu Feb 27, 2025 5:23 pm
Hi everyone, Trying to read this long thread, but still lost about tax on Tbills.

I understood that Tbills are max for a year, so if I purchase a Tbill right now for Feb 2026, then I will pay cash to purchase that tbill and it will mature in 2026 Feb and I will get my cash back. 

Assuming 5% interest for a year, I will pay 95k today in Feb 2025 and will get 100k back in Feb 2026.

My 2nd understanding is that tax for Tbill is at the maturity. So in this case the 5k of the tax will be incurred in Feb 2026 when it matures, so i will file that tax in April 2027. However, I am confused about tax, Could you please confirm if this is the case or not ? 

1) Will I get a 1099 at the End of Dec 2025 with imputed (accured) tax and have to file it in the tax in April 2026.
Or
2) I will get 1099 at the end of Dec 2026 (because that Tbill matured in Feb 2026) and will have to file it in the tax in April 2027.

The second answer. Interest is paid at maturity for t-bills. You will get 1099-INT for the year 2026 and you will pay taxes for it when you file in 2027. Assuming you are buying a t-bill with 1 year or less maturity.
[/QUOTE]

Correct. 

Clarification 1: maximum maturity for a Tbill is 52 weeks, so all "t-bills" have a maturity of less than one year. Anything with a longer original maturity is a Treasury note or bond, not a bill, and taxes for these are handled differently, as summarized in the OP.

Clarification 2: Brokers usually issue a consolidated 1099, which includes 1099-INT, in Feb. So you'll receive the 1099-INT for 2026 in Feb 2027--at least that's when I get mine.

Curious as to what was not clear about this in the OP:

[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Treasury bills are the easiest to understand. Say you pay $990 for $1,000 of face value (this is the minimum at a broker). At maturity you'll receive $1,000; $10 of this will be reported as interest in box 3 of 1099-INT for the year of maturity. IRS publications refer to this $10 as accrued acquisition discount.

Treasury bill interest (accrued acquisition discount) is exempt from state and local income tax, as is anything reported in box 3 of 1099-INT. All of this is true whether you buy at auction or on the secondary market.

EDIT. Tax reporting for bills sold before maturity is more complicated. For a detailed explanation of how I handled this for a Schwab 1099 using HR Block tax software, see this post: How to report gain/loss and interest for Tbills sold before maturity
[/QUOTE]

I underlined the part where it specifies that the interest is reported on 1099-INT for the year of maturity.

Note also that it's more complicated if you sell before maturity, but it sounds like you don't plan to do that.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: IDpilot wrote: Sun Feb 23, 2025 8:17 amneowiser wrote: Sat Feb 22, 2025 6:57 pm]
IDpilot wrote: Sun Feb 23, 2025 8:17 am
neowiser wrote: Sat Feb 22, 2025 6:57 pm
My tax preparer sent my return with accrued market discount from T-notes reported as capital gains. Instead of adjusting the discount, she entered it as gain. She argues that the net effect on total income will be the same, but I worry we will run afoul of the IRS since capital gains are taxed differently than interest income. 

I bought TurboTax yesterday after losing confidence in the tax preparer. TurboTax properly adjusts (subtracts) the accrued market discounts shown on 1099-B and adds the interest to schedule B named as Accrued Market Discount. Problem solved, tax preparer fired...

If the capital gain is entered as short term, the your ex-tax preparer is correct.  It will be taxed as ordinary income just as interest is.
[/QUOTE]

I enter my accrued market discount in box 3 (Treasury interest) of my dummy 1099-INT, so it gets deducted from income for state income tax purposes. My state taxes capital gains.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: neowiser wrote: Sat Feb 22, 2025 6:57 pm]
neowiser wrote: Sat Feb 22, 2025 6:57 pm
My tax preparer sent my return with accrued market discount from T-notes reported as capital gains. Instead of adjusting the discount, she entered it as gain. She argues that the net effect on total income will be the same, but I worry we will run afoul of the IRS since capital gains are taxed differently than interest income. 

I bought TurboTax yesterday after losing confidence in the tax preparer. TurboTax properly adjusts (subtracts) the accrued market discounts shown on 1099-B and adds the interest to schedule B named as Accrued Market Discount. Problem solved, tax preparer fired...
[/QUOTE]

Good for you. I've added extended "discussions" with tax preparers who are stuck in their way of doing things, and are unwilling to do it correctly, even when I've quoted the IRS publications.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: muel87 wrote: Fri Feb 21, 2025 5:27 pmKevin M wrote: Fri Nov 18, 2022 1:05 pm]
muel87 wrote: Fri Feb 21, 2025 5:27 pm
Kevin M wrote: Fri Nov 18, 2022 1:05 pm
Right, but it is included in a supplemental section of the composite 1099 for the year the accrued interest is paid, which as you explain, may not be the same year you bought the Treasury, so you do have to remember this for the following tax year in this case.

So if I purchased TIPS in June 2023, received interest a month later, and forgot to account for this accrued interest paid on 2023's taxes. The TIPS matured in 2024. What if I account for it on my 2024 taxes?
[/QUOTE]

This situation is not addressed in IRS Pub 550, which simply states this:
[QUOTE]
Accrued interest on bonds. If you received a Form 1099-INT that reflects accrued interest paid on a bond you bought between interest payment dates, include the full amount shown as interest on the Form 1099-INT on Schedule B (Form 1040), Part I, line 1. Then, below a subtotal of all interest income listed, enter “Accrued Interest” and the amount of accrued interest you paid to the seller. That amount is taxable to the seller, not you. Subtract that amount from the interest income subtotal. Enter the result on line 2b of Form 1040 or 1040-SR.
[/QUOTE]
So technically you should prepare an amended 2023 return using Form 1040-X, and modify your Schedule B to show the accrued interest paid in 2023.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: KeepinItPositive wrote: Sun Feb 16, 2025 4:06 pmKevin M wrote: Sun Feb 16, 2025 2:12 pm]
KeepinItPositive wrote: Sun Feb 16, 2025 4:06 pm
Kevin M wrote: Sun Feb 16, 2025 2:12 pm
Of course you need to reduce the interest reported in the HRB 1099-INT form that was imported (the one in which you do the AMD adjustment), since you need to move at least enough interest from this form to the dummy form to cover the accrued interest adjustment. I keep track of this in a spreadsheet, in case I ever need to explain what I did in an audit.

Kevin,

Thank you very much for your reply.   If I'm understanding your response correctly, you suggest accounting for accrued interest adjustment on the dummy 1099  (as a subtraction) alongside the AMD adjustment (positive interest on dummy 1099) Why not just adjust for accrued interest directly on the imported 1099-int?  There is an interview question in HR Block that looks like it will serve the purpose 'Interest item requires an adjustment' and then on the next page ' Bought or sold bond between interest payment'. Does this have something to do with state taxation treatment?
[/QUOTE]

Sorry, I misspoke. I was thinking of a 1099-INT for which there is both an amortized bond premium (ABP) and accrued interest, which is a situation I need to deal with on some returns. Since you can only make one of these adjustments per 1099-INT, a second, dummy 1099-INT is required to make one of the adjustments. If you don't have any amortized bond premium in addition to accrued interest paid to seller, this is not applicable to you.

Creating a dummy 1099-INT to enter accrued market discount as interest is a completely separate topic, and it has nothing to do with doing the accrued interest adjustment on the imported 1099-INT.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: KeepinItPositive wrote: Sun Feb 16, 2025 10:49 am]
KeepinItPositive wrote: Sun Feb 16, 2025 10:49 am
Filling out taxes using HR Block this year for treasuries + treasury based money markets from fidelity.  From reading this thread, I believe I know how to do this properly but would appreciate a check on using consolidated 1099 from fidelity (see approach below).  I’ll start by importing from fidelity to HR Block . Treasuries were bought on secondary market and held to maturity.

1099-B: Accrued Market Discount (1f) is not included in import.  Subtract this out of 1099-B.  In my case this will zero out cap gains.
[/QUOTE]
As I posted above, I added the market discount shown on the 1099-B PDF to box 1f in the HRB 1099-B form. I think you need to do this, since otherwise you won't be presented with the interview page where you enter the adjustment (as a negative number). Even if you could enter the adjustment without making an entry in box 1f, I would want the 1099-B entries in HRB to match those on the PDF; I think this would help me if I were to review the return in a few years. After all, if I entered the 1099-B manually in HRB, I would've entered accrued market discount in box 1f.

[QUOTE]
1099-INT: Create ‘fake’ 1099-INT to adjust interest upward for accrued market discount from 1099-B (1f). On original imported 1099-ints, adjust interest downward to account for accrued interest listed in supplemental information taking care to make sure that bonds actually paid the interest during the tax year (and if not carry this forward to next year)
[/QUOTE]
Of course you need to reduce the interest reported in the HRB 1099-INT form that was imported (the one in which you do the AMD adjustment), since you need to move at least enough interest from this form to the dummy form to cover the accrued interest adjustment. I keep track of this in a spreadsheet, in case I ever need to explain what I did in an audit.

[QUOTE]
1099-OID:  No adjustments needed from what gets imported.  This acts to add to taxable interest.
[/QUOTE]
Correct.

[QUOTE]
1099-DIV: In my case these are solely from FIDELITY GOVERNMENT MONEY MARKET, SPAXX,  For state income tax purposes, claim a percentage of this as having been derived from us treasuries using the  percentage fidelity provides in this years “ Percentage of Income from
U.S. Government Securities”. This will reduce state liability a bit.
[/QUOTE]
Correct, as long as you don't live in one of the states that have "50% requirements", such as I do (CA), in which case none of the interest from SPAXX is exempt from state income tax. This is why I use primarily FDLXX for taxable accounts for which the marginal state tax rate justifies using a Treasury money market fund. It can't be used as a core MM fund, but I move anything that appears in the core MM fund into it ASAP.

Also, it's more complicated for me because most taxable accounts also hold stock mutual funds or ETFs, so I need to calculate the percent of dividends from FDLXX, then multiply this by the percent Fidelity indicates as USGO to get the percentage to enter into HRB.

[QUOTE]
For the accrued market discount and accrued interest adjustments, is there a good resource to determine whether to these are exempt from state taxes?
[/QUOTE]
This has been discussed at length, with references to resources for various states. As I recall, there may even have been a separate thread started to discuss this. I think the conclusion is that accrued market discount on Treasuries is exempt from state income tax in most if not all states. So I enter the AMD into box 3 in the dummy 1099-INT.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=0

Accrued market discount not imported to box 1f for Fidelity 1099-B
			Just wanted to report that accrued market discounts were not imported into box 1f of the 1099-B forms for Fidelity using HRB. Since no adjustments were reported, HRB grouped these into short term and long term sales for simplified reporting purposes. When I clicked on a group, the individual sales were shown, and I entered the AMD shown for each on the hardcopy 1099-B into box 1f and the adjustment (negative) on the next screen. As I did this for each one, it was removed from the group, so in the end, there were no groups, just individual sales.

As a reminder, the total of the AMD adjustments are reported as interest on 1099-INT, and with HRB one must manually create a 1099-INT to enter this interest.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Artsdoctor wrote: Mon Feb 03, 2025 8:18 amKevin M wrote: Fri Jan 31, 2025 7:35 pm]
Artsdoctor wrote: Mon Feb 03, 2025 8:18 am
Kevin M wrote: Fri Jan 31, 2025 7:35 pm
Whether or not 1099-INT shows the interest in box 1 or 3 does not depend on tax software.

That's very true.  But how it's entered into your final tax form will depend on the software.  No matter how it's reported on your 1099, you might still have to make sure that it's entered correctly on your state tax form and sometimes that has to be manually.  It's how it's done manually that will depend on your tax software.

This is February 3, so you know there will be innumerable questions now about how to handle treasuries and GSEs on state tax reporting, including tax software entries.  People will try to download their tax forms with the expectation that everything will go where it's supposed to, and we know that that's not always the case.
[/QUOTE]

Sure, but you didn't quote the question that we were answering: 
[QUOTE: ginahoy wrote: Fri Jan 31, 2025 11:18 am]
ginahoy wrote: Fri Jan 31, 2025 11:18 am
If anyone else holds federal agency bonds, I'd be interested to know if your 1099 includes the interest in Box 1 or Box 3.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Artsdoctor wrote: Fri Jan 31, 2025 3:21 pmginahoy wrote: Fri Jan 31, 2025 11:18 am]
Artsdoctor wrote: Fri Jan 31, 2025 3:21 pm
ginahoy wrote: Fri Jan 31, 2025 11:18 am
I bought some TVA bonds last year. I understand these are exempt from state tax, like other federal agencies. However, my Wells Trade 1099-INT doesn't include them in Box 3 (Interest on U.S. Savings Bonds and Treasury Obligations). I'm not sure if this is because WT doesn't consider TVA bonds to be a treasury obligation and thus not exempt from state tax, but everything I've read indicates that federal agency bonds are indeed state tax exempt. 

If anyone else holds federal agency bonds, I'd be interested to know if your 1099 includes the interest in Box 1 or Box 3.

It will depend on your tax software.  For example, if you were using TurboTax for California, you'd go into your state tax return to Schedule CA where interest and dividends are either added or subtracted.  You'd find that the line for subtracting your GSE interest would take you to a worksheet where you'd be able to easily enter the GSE interest and note the name of the bond.  All of that would then be integrated into your CA tax return and you wouldn't have to override anything.  I can't speak for other software programs.
[/QUOTE]

Whether or not 1099-INT shows the interest in box 1 or 3 does not depend on tax software.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: JayB wrote: Fri Jan 31, 2025 11:26 amginahoy wrote: Fri Jan 31, 2025 11:18 am]
JayB wrote: Fri Jan 31, 2025 11:26 am
ginahoy wrote: Fri Jan 31, 2025 11:18 am
I bought some TVA bonds last year. I understand these are exempt from state tax, like other federal agencies. However, my Wells Trade 1099-INT doesn't include them in Box 3 (Interest on U.S. Savings Bonds and Treasury Obligations). I'm not sure if this is because WT doesn't consider TVA bonds to be a treasury obligation and thus not exempt from state tax, but everything I've read indicates that federal agency bonds are indeed state tax exempt. 

If anyone else holds federal agency bonds, I'd be interested to know if your 1099 includes the interest in Box 1 or Box 3.

I hold lots of TVA bonds and the 1099-INT also does NOT include their interest in Box 3. Technically, TVA bonds are not Treasury Obligations. However, on my PA state tax return Schedule A (Taxable Interest Income), there is a place to subtract out Interest income from direct obligations of the US Government (line 7). And there is an additional line (8) entitled "Other reduction adjustments." It is on the latter line that I enter the total of all Agency interest that is not taxable in my state. On line 8, I also include a description: "PA-Exempt interest from TVA U.S. Agency Bonds."

Unfortunately, I have tried repeatedly to work these amounts through Turbotax (online), and it never gets it right. So I end up paper filing my State return.
[/QUOTE]

I don't use online tax software because download versions offer more flexibility. With the HRB download version, you can enter items directly into forms, and this can be a way to enter state subtractions or additions that may not be possible in the interview. Worst case, you can override a form entry, but then you cannot e-file. I have done both for some more complicated returns.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: gavinsiu wrote: Sat Jan 25, 2025 7:40 pm]
gavinsiu wrote: Sat Jan 25, 2025 7:40 pm
A question on taxation of Tbill and TIPS after treading through the various post. So I purchased a bunch of T-Bills on the primary market and then some TIPS on the secondary market.

Can I assume that Tbill are tax upon maturity? So If purchase a TBill in Nov and it matures next year, it's going to be taxable next year? I am thinking that this is correct since it would show up in 1099-INT but wanted to make sure.
On the 1099 consolidated is an entry that said "Accrued Interest Paid on Purchases". I am thinking that this is the interest accursed to the seller because I purchased on the secondary market. The TIPS were purchased around April or before and therefore has had a coupon payment or two since (TIPS pay every 6 months).
The 1099 Shows a fee which appears to be a ATM fee reimbursement, I assume this has nothing to do with Tbill or TIPS or taxes in general?

So to enter this into HR Block software, I have to create two 1099-Int entries, one for the 1099-int and the other for 1099-OID? 

For the OID, I would select the option "Brought or sold this bond between interest payments" and then enter the "accused interest paid on the purchase"? 

Anything I might be missing?
[/QUOTE]

1. Yes.

2. Yes, you deduct the interest paid to seller as you indicate.

3. Correct.

Yes, 1099-INT and 1099-OID are two separate forms, so are entered as such in HRB.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: GoldenBear17 wrote: Fri Aug 23, 2024 9:12 am]
GoldenBear17 wrote: Fri Aug 23, 2024 9:12 am
When you say there could be accrued interest, do you mean if the treasury bond is a re-opening or something? How would there be accrued interest on a new bond bought at auction that isn't a re-opening?
[/QUOTE]

Every Treasury has a "dated date", which is the date interest starts accruing for a coupon issue. Sometimes the dated date is before the issue date for new issues, in which case there will be a small amount of accrued interest that will be included in your total purchase amount. Looking at recent 2-year auctions, for the 7/23/2024 auction, dated date and issue date were both 7/31, so no accrued interest, however for the 06/25/24 auction, dated date was 06/30/24, but issue date was 07/01/24, so there was 0.12568 accrued interest per $1,000 face value.

[QUOTE]
It's troubling and confusing that there isn't a single page that is just a basic overview of this subject.

You say there is nothing complicated about what I want to do. But the reason I hesitated in the first place is due to some posts I read.

The Finance Buff seems like a brilliant person. And he says in this post:

https://thefinancebuff.com/buy-treasury ... ates-taxes

"Selling Treasuries in a taxable account on the secondary market before they mature adds yet more complications to your taxes. If you must buy Treasuries on the secondary market in a taxable account, at least hold them to maturity and don’t sell them on the secondary market."

And in this post he basically says buying and selling Treasuries with maturities longer than a T-Bill complicated taxes so much he won't even do it.

https://thefinancebuff.com/buy-treasury ... taxes.html
[/QUOTE]

I don't know why Harry Sit is so conservative about this--typically I hold to maturity, but I have sold some Treasuries before maturity, and don't recall it being that complicated to deal with the taxes.

[QUOTE]
I'm extremely confused why a broker can't just give you a form with all the information you need in these cases and you put it in TurboTax and are done. Clearly this isn't the case if The Finance Buff, who writes about pretty in-depth stuff, says this is beyond his willingness to get involved in.

Since you buy your treasury bonds (and maybe even longer-maturities) on the secondary market, you must be familiar with exactly how this is handled on taxes. How is it that nobody has written down something like "These are the 3 things you need to look at when doing taxes related to buying or selling a treasury bond on the secondary market"?
[/QUOTE]
One thing to consider is that TT and HRB handle some things a bit differently, and I use HRB, so can't speak directly as to how TT handles these things--others who use TT chime in with their experience on these things. As I recall, the way they handle market discount is different, for example.

If it were tax season, and I had sold a Treasury note or bond before maturity, I'd be more inclined to provide a detailed explanation of the steps involved using HRB. I'm sure I've done things like that in posts in this thread, but I'm too lazy to try and consolidate or organize it. Sorry.

[QUOTE]
I guess I can wait and then if I end up confused I can post my situation here for help. That's comforting. But it's not comforting that I can't find anywhere on the web a simple explanation of how to do taxes on treasury bonds that involve the secondary market. How are people doing this if it's not explained anywhere?
[/QUOTE]

I guess people who are aware of this thread get some of their answers here. It's virtually certain that everyone doesn't do everything correctly, and there are some areas that I consider to be somewhat gray where even participants in this thread do things slightly differently, but at least we can all present our facts and our reasoning, and then each of us can decide on how to proceed.

Many of us have dug through the IRS publications, and between that and very careful attention to the guidance provided by tax software, along with what we learn here, we've figured out how to do what we believe to be the right way, or at least an acceptable way, to do it.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: GoldenBear17 wrote: Thu Aug 22, 2024 6:02 am]
GoldenBear17 wrote: Thu Aug 22, 2024 6:02 am
I'm assuming if I buy a treasury bond at auction, it's not a re-opening, and I hold to maturity, then I will just declare the interest from each semi-annual payment for the tax year when I receive it and pay federal tax on it and it's no more complicated than that. Is that right?
[/QUOTE]
I only buy on secondary, so can't speak from experience, but other than the interest reported on 1099-INT, there may be some accrued interest paid that you can deduct from you first coupon payment. Accrued interest paid is generally reported in a supplementary section of the broker's composite 1099.

[QUOTE]
But if I buy a treasury bond at auction and sell it before maturity, I know some other complications come in. What I can't find is a clear explanation of all the factors that's easy to follow. From what I can gather there are 3 factors that could possibly be involved in taxes in this situation. The interest, possible capital gains, and possible market discount or premium. Are these the only 3?
[/QUOTE]
There will be no reportable market discount or premium for new issue notes bought at auction. There will likely be a small market discount, but it will be "de minimis", and as such it is not reported for tax purposes. There could be a capital gain or loss which would be reported on 1099-B, so dealing with that in TT is straightforward.

[QUOTE]
Is there a page in this thread or on the Wiki or elsewhere that just walks clearly through all the factors for taxes in each case with a treasury bond bought at a non-reopening auction - held to maturity or sold early? Even better if there's a clear explanation of how to handle these cases in TurboTax.
[/QUOTE]

Not that I know of. I wouldn't worry about it though, since you can easily get answers to your questions here when you actually receive your 1099s, and there's nothing complicated about what you want to do.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Tue Jun 11, 2024 8:46 amJaylat wrote: Thu Jun 06, 2024 3:17 pmKevin M wrote: Thu Jun 06, 2024 2:41 pmJaylat wrote: Thu Jun 06, 2024 2:10 pm]
Jaylat wrote: Tue Jun 11, 2024 8:46 am
Jaylat wrote: Thu Jun 06, 2024 3:17 pm
Kevin M wrote: Thu Jun 06, 2024 2:41 pm
Jaylat wrote: Thu Jun 06, 2024 2:10 pm
Here you go:

Can you share the spreadsheet, or a version of it? I can't comment much without seeing the actual spreadsheet. Please PM me if you'd rather take this offline.

Thanks.

Sent you a PM with the spreadsheet. It's converted from Numbers to Excel, but looks like it works the same.

Just checking if you are going to respond to this?
[/QUOTE]

I did respond. Here's the essence of my reply, substituting my "blog" email address for my personal email address; either one works:

You can upload the Excel file to any file sharing service, and share it with me.
I use Google for most online stuff, so I would share to google drive, then share it.
Or you could import it to Google Sheets yourself, then share it with me.
You could just email it to me at KevinOnInvesting@gmail.com.

With Google you can either share a file with anyone who has the link, in which case I just need the link, or you can share it with specific users, in which case that would be KevinOnInvesting@gmail.com.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Thu Jun 06, 2024 2:10 pm]
Jaylat wrote: Thu Jun 06, 2024 2:10 pm
Here you go:

[/QUOTE]

Can you share the spreadsheet, or a version of it? I can't comment much without seeing the actual spreadsheet. Please PM me if you'd rather take this offline.

Thanks.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Thu Jun 06, 2024 7:24 am]
Jaylat wrote: Thu Jun 06, 2024 7:24 am
Seems we're getting caught up on terminology. I'm referring to each bond with a different CUSIP number as a TIPS. There are 9 years and 9 CUSIPS from 2025-2033. 2034 is one more CUSIP. How would you refer to these?
[/QUOTE]
Fair enough. I tend to distinguish them as different "tips issues", but now I know what you mean, which is all that matters. Thanks for clarifying.

[QUOTE]
A TIPS with a 1% coupon pays a 1% coupon yield. How would you refer to that?
[/QUOTE]
Either just as "coupon" or "coupon rate". We had a long discussion about this in some thread, maybe a year or so ago, and I think we landed on just "coupon" as most standard. Brokers tend to use just "coupon", e.g., as the column name for it, while Treasury refers to it as "interest rate", which of course also is fine. However, TreasuryDirect does include "Coupon" in their glossary, with this definition:

[QUOTE: TreasuryDirect wrote:]
TreasuryDirect wrote:Coupon (or Coupon Rate) - The interest rate stated on a bond when it is issued. The coupon is typically paid twice a year.
[/QUOTE]
Again, knowing what you mean is the most important thing.

As I said, the 2034 has a 1.75% coupon, not a 1% coupon. I think you're confusing the % of DARA figures in the first sheet I shared the screenshot of with coupon rate.

[QUOTE]
You keep referring to "the spreadsheet" which I found very confusing. Is that #cruncher's spreadsheet? Why is it so difficult to add columns to his spreadsheet? It seems like you are treating his spreadsheet as some kind of "Magic Box" that can't be fiddled with.
[/QUOTE]
Yes, in the context of our discussion, all references to a spreadsheet have meant to #Cruncher's spreadsheet; sorry if that wasn't clear.

I have added columns for my purposes, but the spreadsheet is extremely complex, so doing anything other than fairly simple modifications is somewhat daunting. You should take a look at it. There's a link to it here: TIPS Ladder Spreadsheets in General & Two in Particular - Bogleheads.org

[QUOTE]
At any rate, we still have not scratched the surface of the central theme, which is offsetting the TIPS tax liability on the remaining TIPS portfolio with TIPS coupons.
[/QUOTE]

From my perspective we've scratched the surface, by 

Coming up with a relatively simple way to get the #Cruncher spreadsheet to ignore coupons for DARA, which I thought originally was one of your main objectives, in is different than what most people do (I think),
Identifying that #Cruncher's interest and OID web page provides the necessary info on OID. I think if one were using it now, they be looking at TIPS Interest - 2024.

After thinking about it for a couple of minutes, it might not be too hard to:
Import the OID page into a google sheet, using the formula below, which I just did:Code: Select all=IMPORTHTML("https://eyebonds.info/tips/int/tipsint_2024.html","table",1)
Do the calculations required to determine OID to date for the ladder,
Use whatever estimation technique you want to project OID for the rest of the year, and
Calculate total estimated OID for the year.

None of this requires messing with the underlying ladder building functioning of the spreadsheet, which is the complicated stuff, so probably quite doable.

It might not even be too hard to implement the OID functionality of #Cruncher's webpage in one's own spreadsheet, which I assume is what you do, and is what I've done to verify that the OID reported on different broker's 1099-OIDs is accurate (done for the tax returns family and friend who hold TIPS in taxable and whose taxes I do). This would eliminate reliance on the webpage.

[QUOTE]
I will try to put together my own spreadsheet to show this.
[/QUOTE]
That would be great. I got the idea that you already had a spreadsheet to do it.

[QUOTE]
Thanks again, enjoying the conversation.
[/QUOTE]
As am I.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Wed Jun 05, 2024 3:20 pm]
Jaylat wrote: Wed Jun 05, 2024 3:20 pm
However, in your spreadsheet you show aggregate coupons as a % of the first years’ or maturing year’s TIPS. Not sure why that’s relevant?
[/QUOTE]

That's just a measure of the coupon front loading. I've found it useful in several discussion about how TIPS ladders work; i.e., that much more of the DARA is provided by coupons in the earlier years. Here we saw how it increased as I worked through the alternatives. Remember how it was 8% for 2025, and then when I bumped the 2034 multiplier to 4, it went to 13%. Maybe of no interest to you, but it has been useful to me.

[QUOTE]
As I stated early in our discussion (and underlined) you need to pay OID income tax on the total TIPS portfolio.
[/QUOTE]
OK, I get ya now. Although we have everything we need to estimate coupon interest for the first year, nowhere in the spreadsheet, as far as I know, is OID calculated for each year.

HOWEVER, this spreadsheet was designed to build a TIPS ladder, not to help with tax reporting. 

#Cruncher has a webpage that reports interest and OID for each month.

Start here: TIPS - Home. Then click on the year of interest in the right column; I'll click 2024, which takes me ...
Here: TIPS Interest - 2024

I've seen #Cruncher share this with folks asking about this topic more than once. Not a bad idea to repeat the share in this thread.

[QUOTE]
You show 9 TIPS at around $100,000 each for years 2025-2033 and one TIPS at $400,000 for 2034. That gives a total inflation adjusted TIPS portfolio of $1.3 million, which magically gives us the same 1.0% coupon yield that I referred to earlier.
[/QUOTE]
Don't know where numbers 9 and 1 are coming from. The number of bonds (TIPS) is shown in column B of the sheet I shared.

The real principal as of the reference date, in this case June 6, since that is settlement for a purchase today, and I loaded the TIPS today, is 1,305,320, and the real principal + interest is   1,405,285. These numbers are lower down in the spreadsheet, so not shown in the screenshot I shared.

I don't know what you mean by 1% coupon yield.

[QUOTE]
You also show that the $400,000 in TIPS remaining in 2034 have about a 1.0% coupon yield, which again is what I would expect from my thumbnail analysis. Most likely the intervening years have an average coupon of around 1.0% as well?
[/QUOTE]
I don't know what "coupon yield" means. That number, 1%, is the percentage of the ARA delivered that year by the coupons. The 2034 coupon is 1.75%.

[QUOTE]
To me, that’s all I need to know. That 1.0% yield at a 22% marginal rate covers up to 3.54% OID inflation plus the coupon, which hopefully will be sufficient. I know if inflation is heading above that number it’s time to scrounge for pennies under the couch cushions.
[/QUOTE]
Again, #Cruncher's interest and OID web pages probably is the tool people would want to use for tax reporting purposes. No need to complicate the ladder builder spreadsheet. I think we've gone as far as we need to for the purpose of ladder building when you want to target principal only for DARA.

It may help to show the Ladder sheet of the #Cruncher spreadsheet. I've made some modifications to the spreadsheet so that I can use Schwab quotes instead of WSJ quotes, and I've hidden a bunch of columns and rows that aren't germane to the discussion, so it looks a bit different than the OG #C version. There also were a few modifications left over from a previous experiment, and I've fixed those for this version.

Note that the multipliers are shown

[QUOTE]
Again, really appreciate your spending so much time on this!
[/QUOTE]

NP, it's fun stuff.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			It took me a few minutes to figure out a way to tweak the multipliers to get principal close to DARA, with larger coupon contributions, which should be close to what Jaylat wants. Of course you could just use trial and error, but I figured out a way to do it with a calculation, but it requires a copy and paste/value for each row, starting from the last year in the ladder, before entering the formula. Takes about 10 minutes if you know how to do it.

Here are the results:

Note that Principal is close to DARA of $100K, but because of the larger coupons, Actual Total Proceeds = Actual Real Amount (ARA) is larger than Actual Real Principal (ARP) by the amount of the Actual Real Interest (ARI).

So, if anyone is interested in doing something like what I understand Jaylat to be doing, I have a solution that I can share. Hopefully Jaylat will share his implementation method, and if there's enough interest, maybe the one or the other of the tools guys could implement it in their tool.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			To clarify why this discussion is in this thread when most of it seems more about ladder construction: Jaylat's goal is to use the ladder's coupon interest to hopefully cover the unpredictable taxes on the inflation adjustment income reported on 1099-OID each year. So that's what makes it about taxation. It gets into ladder construction because the way Jaylat thinks it'll work best for him is to exclude coupons from DARA (Desired Annual Real Income), but this is not supported by the two standard ladder construction tools I know of. I work with the #Cruncher spreadsheet, so unless there's a way to do it with that, I can't investigate it.

I assume that this might be of interest to anyone holding their ladder or part of it in taxable, so we'll continue in this thread as long as it seems applicable to the taxation goal.

The other candidate for discussions that don't seem to fit well here is What's up (or down) with TIPS? - Bogleheads.org, since that thread is a catchall for any discussions or questions about TIPS not obviously covered in another, somewhat active TIPS thread.

[QUOTE: Jaylat wrote: Wed Jun 05, 2024 8:09 amKevin M wrote: Wed Jun 05, 2024 7:01 am]
Jaylat wrote: Wed Jun 05, 2024 8:09 am
Kevin M wrote: Wed Jun 05, 2024 7:01 am
What I think would be useful would be for you to share a spreadsheet or whatever you use to construct your ladder, and show us how your method works in practice.

Ignoring the coupons for DARA and hoping that they cover the highly unpredictable taxes doesn't seem to have any more merit the using methods we can more easily use in #Cruncher's spreadsheet. With your latest reply I'm thinking that fixed DARA using variable multipliers might get close to what you are doing with coupons, but I need to go back to sleep for a few hours, and I'll get back to this later today.

I already have a few points in mind that I want to address. Back in a few ...

I’m travelling and don’t have my spreadsheet, but here goes with a simple example:

A 20-year TIPS ladder of $50,000/year will start out at an inflation adjusted principal of $1,000,000 in year one and drop to $50,000 in year 19. Let’s assume that’s a big part of the investor’s portfolio. Obviously, OID income taxes on $1MM will be a lot higher than on $50,000.  

So we can see from the outset that simply applying a fixed percentage tax gross-up to the annual DARA is a nonstarter. The percentage gross-up would have to change, year by year, every year for the next 20 years. I could do that calculation, but why bother? It will change every time I buy a new TIPS. And my DARA amounts are different for many ladder years, as I assume things like travel expenses will taper off. 

My own TIPS portfolio has a blended interest rate coupon of almost exactly 1.0%. I’m concerned about OID taxes, which are unpredictable, and want funds to be available to pay taxes on OID income. 

I’m in the 22% marginal tax bracket, and there are no state taxes on TIPS, so the total TIPS income (OID plus coupon) covered by my 1.0% coupon is 1.0%/0.22 = 4.54%. So the TIPS coupon covers taxes on the interest of 1% plus OID income of up to 3.54% per year. 

That’s pretty good! No, it won’t cover every year if there’s high inflation, but neither will an estimated tax-gross up. 

Is it perfect? No, but it’s a decent “set it and forget it” method of putting aside funds for taxes on OID income (did I mention OID income is completely unpredictable?). I can happily buy and sell TIPS knowing that I don’t need to recalculate 20 years of tax gross-ups each time. The coupons roughly cover the tax expense. 

In my case, OID income is the one “wild card” in my tax planning. I sleep better knowing that my TIPS coupons cover it under many (not all) conditions.
[/QUOTE]

I'll wait till I can see it in a spreadsheet. I'm doing everything with #Crunchers tips ladder spreadsheet, so I'm looking for ways to cover your scenario with the applicable constraints. One of the constraints is that I see no quick way to ignore the coupons in calculating ARA with the goal of matching DARA. #Cruncher may be able to whip something up to do it, but in the meantime, I'll share ideas that others could use using a standard tool, unless you're willing to share your spreadsheet with us.

Here are a few quick observations in working toward a solution that meets your criteria:

I'll play with a 10 year ladder, 2025-2034, to avoid gap year complications.
I'll enter a multiplier for only one row of each year, so for one TIPS CUSIP.
I'll enter the multiplier in the longest maturity available for each year, so Oct or Jul, except for Jan 2034 (since there is no Jul yet).
I'll use DARA of $100K. I think changing the multipliers provides more flexibility to ARA each year, whether it comes from coupons or principal. Since money is fungible, it doesn't matter where it comes from. You use your approach because it seems simpler to you to exclude coupons from DARA.
With all multipliers = 1, the coupon interest is much larger for the earlier years.* So this automatically front loads coupons to some extent.

Note that coupons for the early years are 8% of total, falling to 3% for 2033 and 1% for 2034.

Of course the downside relative to what I understand the Jaylat approach to be, without having yet seen any numbers, is that the principal portion of DARA is < DARA for the years with the larger coupons.

it follows that by using larger multipliers for later years, we can generate more coupon interest for the earlier years. If we want to extend the ladder beyond 10 years, and cover gap years with the 2034, we'd increase the multiplier for that by the number of gap years being covers. Say we want a ladder through 2037, so 4 gap years: 2035,36,37. So we add 3 to the 2034 multiplier, making it 4. Here is #Cruncher presentation of the result:

Note that the coupon % of total now is even larger for the earlier years, from 13% for the early years, and still fairly larger at 8% for 2033. Again, principal is even further below DARA for most years due to the larger coupon contributions.

#Cruncher doesn't lay out the projected cash flows for the gap year, but the tipsladder.com tool does:

I think the next step would be to tweak the multipliers for each year to get the principal portion closer to DARA. I'll do that in my next reply in this thread.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Wed Jun 05, 2024 8:40 amKevin M wrote: Wed Jun 05, 2024 7:01 am]
Jaylat wrote: Wed Jun 05, 2024 8:40 am
Kevin M wrote: Wed Jun 05, 2024 7:01 am
As I carefully look back at our exchanges, I believe that each of my replies adequately addresses the post of yours it's responding to. Each of your subsequent posts raises some additional objections, and perhaps makes some inaccurate or confusing (to me) statements as well.

What inaccurate statements have I made?
[/QUOTE]

No offense, I just reacted that way to a few things. I'll get to them when I address your latest posts; maybe I'll find no inaccuracies after all.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Tue Jun 04, 2024 4:37 pmKevin M wrote: Tue Jun 04, 2024 8:43 amJaylat wrote: Tue Jun 04, 2024 7:23 amKevin M wrote: Mon Jun 03, 2024 8:40 pmJaylat wrote: Mon Jun 03, 2024 7:14 pmJaylat wrote: Mon Jun 03, 2024 7:14 pm]
Jaylat wrote: Tue Jun 04, 2024 4:37 pm
Kevin M wrote: Tue Jun 04, 2024 8:43 am
Jaylat wrote: Tue Jun 04, 2024 7:23 am
Kevin M wrote: Mon Jun 03, 2024 8:40 pm
Jaylat wrote: Mon Jun 03, 2024 7:14 pm

I hold TIPS in taxable, so taxes have to be paid every year on the OID inflation accrual, which is completely unpredictable. Other non-TIPS income is much more predictable, and so treating it like an expense makes sense. And I like having the coupons available to act as a buffer against a big tax shock.
Ignoring the coupons for your DARA is just mental accounting for increasing your DARA. Either way, you need to have enough ARA to cover expected and unexpected expenses, with unexpectedly large income taxes being in the latter category. 

I don't know how you determined the construction of your TIPS ladder, but #Cruncher's spreadsheet will tell you how many TIPS are needed to meet the DARA for each year. To increase the ARA, you can either increase DARA or make the sum of the multipliers for each year > 1.

Example: 

With a DARA of $100K and a multiplier of 1 for the Oct 2025 TIPS (and only that for 2025), I need 79, and the ARA is 100,715, consisting of 95,132 in principal and 5,583 in interest.
If leave the DARA at $100K but increase the multiplier to 1.3, I need 104, which generates 130,857 ARA, consisting of 125,237 principal and 5,620 interest.
The principal/coupon split isn't correct if I use a multiplier of 1.3 for every year, but the ARA still is about $130K
If I increase DARA to $130K, and use a multiplier of 1.0,  I need 102, which generates 130,091 ARA, consisting of 122,828 principal and 7,262 interest.
Either way I get an ARA of about $130K.
I'm not suggesting that there's anything wrong about what you're doing, but just that it's different way of doing the mental accounting to get the same result.

Jaylat wrote: Mon Jun 03, 2024 7:14 pmI believe your TIPS are all in tax deferred accounts?

Sure, but with high unexpected inflation, my RMDs would be bigger, resulting in more income tax. The impact might not be as large as it is for you, but the principal is the same. If I plan for a DARA that's too low, I would come up short for the RMD, and I'd have to withdraw from later-year rungs to cover the RMD and the additional taxes.

You're right , it is just mental accounting, but the actual accounting is much more complex than what you've posted here (and thanks so much for taking the time to post it!). 

Keep in mind that we're talking about taxes not on just one TIPS at maturity (your example) but on the annual OID interest on every single TIPS in your ladder. For a 20 year ladder that's 20 TIPS you need to pay taxes on every year - not just one. So for TIPS in taxable you actually have relatively few taxes due at maturity - it's all paid on an ongoing basis. 

Do the coupons cover this? Maybe, depending on the inflation rate. But at least the coupons are somewhat correlated with the annual tax liability as they both grow with inflation.

Your 1.3x example would work fine for a distribution from a tax deferred account where all taxes are due at once.

I don't think the point I'm making is getting across.

I realize that you're taxed on the inflation adjustments (reported on 1099-OID) for all TIPS in the ladder.
If you want to pay your taxes on all TIPS OID with the ARA from the ladder, you'll need more ARA than you would for your expenses excluding taxes.
One way or the other, you'll need to estimate the worst income tax case you want to cover.
Then you'll need to estimate ARA to cover OID taxes and all other expenses.
There are at least three ways to ensure that you have the required ARA you estimated in #4.
Increase your DARA.Increase your multiplier for each year.Ignore coupons and set DARA to non-OID expenses with multipliers = 1 for each year
It seems to me that 1 and 2 are more reliable than 3.

I just looked at what thread we're posting in, and realized that we're way off topic. If you want to continue this discussion, I recommend we continue in either:
Taxation of Treasury bills, notes and bonds - Bogleheads.org[, or What's up (or down) with TIPS? - Bogleheads.org/list]

I'm reposting this discussion here at your suggestion. 

I understand your point perfectly, it's the standard strategy of grossing up for taxes. What's not to understand about that? 

The point I am making is quite different: you can’t just apply a blanket 30% gross-up (or whatever number you choose) to your TIPS ladder because the OID income changes each year due to (1) the declining TIPS principal as the ladder runs off and (2) the fact that the OID income and tax liability is completely unpredictable as it’s based on inflation. 

I suppose you could go year-by-year through the next 20 years to estimate a different annual tax gross up for each and every year based on the then remaining TIPS in your ladder. (Of course, this would have to be revised every time you buy a new TIPS). The estimates would also be very far off for years with very high or low inflation. 

Or… you could use the TIPS coupons as a guesstimate for your TIPS OID tax liability. I’d have to run the numbers, but assuming it’s in the ballpark it would be much easier doing it this way. The coupons change automatically with the outstanding principal in the remaining TIPS ladder, and get grossed up with the OID inflation accruals. Every time I buy a new TIPS I get more coupons that can offset the taxes so I don’t need to recalculate 20 years of tax gross-ups. 

I'm happy to be proven wrong. Am I missing something here?
[/QUOTE]

Thanks for moving our discussion in to this more appropriate thread. Did you put a pointer in the original thread for those who might want to follow along?

As I carefully look back at our exchanges, I believe that each of my replies adequately addresses the post of yours it's responding to. Each of your subsequent posts raises some additional objections, and perhaps makes some inaccurate or confusing (to me) statements as well.

What I think would be useful would be for you to share a spreadsheet or whatever you use to construct your ladder, and show us how your method works in practice.

Ignoring the coupons for DARA and hoping that they cover the highly unpredictable taxes doesn't seem to have any more merit the using methods we can more easily use in #Cruncher's spreadsheet. With your latest reply I'm thinking that fixed DARA using variable multipliers might get close to what you are doing with coupons, but I need to go back to sleep for a few hours, and I'll get back to this later today.

I already have a few points in mind that I want to address. Back in a few ...

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Sat Apr 20, 2024 11:21 amArtsdoctor wrote: Fri Apr 19, 2024 3:53 pm]
ginahoy wrote: Sat Apr 20, 2024 11:21 am
Artsdoctor wrote: Fri Apr 19, 2024 3:53 pmI would also avoid buying TIPS in a taxable account unless you fully understand how they're taxed in detail.
I recently read similar advice on a financial vlog about TIPS as a strategy for long term investment. The author shows that TIPS have historically provided significantly higher real returns compared to other treasuries, including Series I, but he argues strongly against holding TIPS in taxable accounts because increases in principal (due to inflation) are taxed currently even though you have to wait 30 years (or until sold) to actually receive those inflation gains.
[/QUOTE]

My standard reply to this is that this is not much different that nominal bond fund reinvested dividends being taxed. Of course with dividends, you have the choice not to reinvest, but if you're investing for a long term, reinvesting dividends is standard practice.

Ditto for individual nominal bonds. Most of my bond coupons are reinvested in a money market fund, which at some point likely will be used to buy more nominal bonds. This goes for bills where the interest is paid at maturity--I often just roll as much of the proceeds as possible into more bills, putting any excess in a money market fund until it gets used to buy more bills.

Of course as a retiree, I do use some interest and proceeds from maturing nominal Treasuries for expenses. But I could do this with a TIPS ladder as well. Sure, I'd get taxed on the inflation adjustments of all TIPS in the ladder, but that's an expense that can be covered with coupons and proceeds from maturing TIPS. And if necessary, I could sell some extra TIPS to pay the taxes.

I manage accounts that have lots of TIPS in taxable, for example because there is no tax-advantaged space, or TIPS cannot be bought in that space. So far I have not observed this being an issue with respect to paying income taxes, and I do the tax returns.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Tue Apr 16, 2024 1:00 pm]
HereToLearn wrote: Tue Apr 16, 2024 1:00 pm
TT automatically copied the AMD from 1099-B to Form 8949.  The sum at the bottom of column g is a negative number (-$8869). I do not see a zero under column g as you indicated above. " Immediately under the adjustment the capital gain is shown as 0."
[/QUOTE]

I wasn't talking about the total, just the entry for the Treasuries with the AMD adjustment, like this:

This is the way it is when AMD = proceeds minus cost. Note that the adjustment is in column g and the gain/loss in column h, which is under column g on the form.

At the bottom you'll see the total of the adjustments in column g, which will be negative if all you have is AMD adjustments, and under that (col h) the total gain or loss for all entries on that Form 8949. These numbers are transferred to columns g and h on Schedule D. Column h is the one that actually matters for tax calculation.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Mon Apr 15, 2024 10:46 pmArtsdoctor wrote: Mon Apr 15, 2024 5:52 pmHereToLearn wrote: Sun Apr 14, 2024 2:04 pmcas wrote: Sun Apr 14, 2024 7:22 amHereToLearn wrote: Sat Apr 13, 2024 5:43 pm]
HereToLearn wrote: Mon Apr 15, 2024 10:46 pm
Artsdoctor wrote: Mon Apr 15, 2024 5:52 pm
HereToLearn wrote: Sun Apr 14, 2024 2:04 pm
cas wrote: Sun Apr 14, 2024 7:22 am
HereToLearn wrote: Sat Apr 13, 2024 5:43 pm

[. . .] but several discussions on this thread are making me question my auto import. [. . .]

At one point, TT posted:  "Since you have more than one kind of interest listed on this interest statement, the amount of your adjustment (other than premium paid on tax-exempt bonds) will be prorated between the different types of interest income.  If you want this adjustment to apply to only one type of interest income, create a separate 1099-INT for each type of elf interest income and enter an adjustment for the appropriate type of interest income."

Do I just let it be or create separate 1099-INTs?  I have CD interest, Money Market interest, and Treasury interest.

Does this previous post help or is it one of the "several discussions" that you have already read (and now would like some independent confirmation on)?   (Thank you for reading though the thread!)

viewtopic.php?p=7127538#p7127538

Thank you so much for your help and I am sorry that it has taken me so long to respond.

I am horrified/embarrassed that I completely forgot the dummy 1099-INT step this year.

I have now reentered all info in a new filing, resulting in $30 more due to Fed and $80 more due to CT.  I understand why I owe more to CT but am not sure why my Fed bill should have increased so am going to step away from the computer for a while and come at it with fresh eyes later this afternoon.  I manually confirmed that the deduction of accrued interest paid on Treasuries automatically moved over to my CT return, hence my additional tax obligation.  I don't know if this mistake would have been caught, but it is my intention to do it correctly so I will file a superseding return this evening.

Once again, I cannot thank you enough.

I pulled up my '22 return within TT and see that I did manage to create the two 1099-INTs last year but had skipped that step for my '23 filing.

I don't want to re-invent the wheel but is it possible that the accrued market discount is not being handled correctly?  It's one of the most common mistakes that people make.

Sometimes, your 1099-B will erroneously transfer the AMD as a capital gain (this can happen with software and it can happen if you're manually entering the figures without knowing about AMD).  If you don't watch out for that, you'll see a capital gain appear on your Schedule D (possibly long-term if you've held it for more than a year), and you'll be taxed as a gain on both federal and state taxes.

If you correct for that on Form 8949, your AMD will be be changed from a gain to income (and you may owe more federal tax).  This is correct.  However, you'll need to make sure that that income is then backed out from your state return in order to avoid paying state tax on that income (most states will not tax the AMD but you'll need to know how your state handles this).

Thank you for reopening this and trying to help me.  Before I go back and attempt to manually adjust anything, may I ask another couple of questions?

I have eight entries on 1099-B with AMD and short term gains.  The entry for each AMD = the amount of the gain.  The total short term gains are offset against short term losses from CDs I sold. (I know...bad idea.)

There is also one long term gain with a matching AMD.  Its gain is offset against long term losses for CDs.  I know I sold the CDs before maturity but it appears the Treasuries all went to maturity for redemption.

Looking up the trade detail for a couple, I still do not understand what adjustment--if any-- I should make.  

Here's an example:  A $50K Dec 31st Treasury note with $6.79 of accrued interest was  purchased on Aug 8 for $49,479.29. If I subtract the $6.70 of accrued interest, the difference between purchase price and redemption amount is $527.50 which is the # reported as both AMD and gain on the 1099-B.

Is that incorrect and do I need to manually adjust on Form 8949?  I can see -$528 on the chart in section 1 of 8949 (in Forms view of TurboTax) along with entries for the other Treasury redemptions (and CDs I sold before maturity).  Or is it impossible to know from the limited info I have provided?

Why is that being reported as a loss?  It seems as though that is not actually a loss and I may owe even more taxes?

I will confess that I didn't give that chart a thought other than to confirm the figures pulled over from Fidelity matched the figures in TurboTax.

I thought that the only figures I had to track and adjust were the Accrued Interest Paid on Purchases that appear in the Supplemental Section.

I decided earlier today that I was not going to attempt to rush to fix this (since I still do not understand) and just mailed in my CT return, knowing that it is incorrect, but will then take the time to figure this out and mail in amended Fed & state returns at a later date.

Again, thank you for reading all of this and attempting to educate me.
[/QUOTE]

I thought we had already answered this. 

In TT, you enter the AMD amount reported in box 1f as the AMD adjustment; in HRB it is entered as a negative number on the screen following the 1099-B data entry screen. Regardless of how it's entered in the tax software, it appears as a negative adjustment in column g of Form 8949. Immediately under the adjustment the capital gain is shown as 0.

Since the capital gain/loss is 0, there is no offset against any other capital gains.

The total amount of the AMDs is reported as interest on Schedule B. I believe TT may do this automatically, but there may be an issue getting this to show up as a subtraction on your state income tax form. With HRB, we enter it in Box 3 of a dummy 1099-INT, which both includes it on Schedule B and subtracts it from state interest income.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Sat Apr 13, 2024 5:43 pm]
HereToLearn wrote: Sat Apr 13, 2024 5:43 pm
Here is where I am confused (or one of the areas) -- Do I need to manually adjust any of the Accrued Market Discounts reported on the 1099-B?  The figures have all been reported in TurboTax, but several discussions on this thread are making me question my auto import.
[/QUOTE]

The AMD adjustment is the lesser of the AMD reported in box 1f and proceeds minus cost, so technically you should calculate proceeds minus cost and enter the lesser of the two as the adjustment, then report the adjustment amount as interest on Schedule B (TT may do this for you, but with HRB we need to use a dummy 1099-INT). I doubt you would get a correction notice from the IRS if you didn't do it this way, and often the values are the same anyway; they should be the same if you held to maturity I think. Any differences have always been quite small in my experience.

[QUOTE]
At one point, TT posted:  "Since you have more than one kind of interest listed on this interest statement, the amount of your adjustment (other than premium paid on tax-exempt bonds) will be prorated between the different types of interest income.  If you want this adjustment to apply to only one type of interest income, create a separate 1099-INT for each type of elf interest income and enter an adjustment for the appropriate type of interest income."

Do I just let it be or create separate 1099-INTs?  I have CD interest, Money Market interest, and Treasury interest.
[/QUOTE]
I would use separate 1099-INTs so the adjustment is for the right type of interest income; that's what I do.

[QUOTE]
The next question is specific to CT so perhaps impossible for non-residents to answer.

Do I need to make a manual adjustment to my CT returns?  I have not filed CT yet as I plan to print and mail those.  

Where does TT pull Interest of US Government Obligations from?  My state return shows a lower dollar amount than Fidelity reported in box 3 of 1099-INT.  The difference does not equal the adjustment to interest I manually input to capture accrued interest paid on purchases from the Supplemental section.  I went in and changed the exempt figure to match box 3 from the 1099-INT, but now I am wondering if I am claiming too much interest as not subject to CT taxes.  If so, I am in trouble as I have forgotten what the figure had been before I manually adjusted it.  (Novice...)

Thank you to anyone who has read this far.
[/QUOTE]

The appropriate amount of USGO should be automatically transferred from Fed to state. This discrepancy could be related to the previous question. You need to do the accrued interest in a 1099-INT with only Treasury interest, so it all is subtracted from the Treasury interest, not allocated between it and the interest in box 1.

To verify, start a dummy return, enter only a 1099-INT with US Treasury interest in box 3, then check the subtractions in the state return. Or if the USGO interest is your only subtraction, just split your 1099-INTs up and do the accrued interest adjustment in the one with the Treasury interest.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: InvisibleAerobar wrote: Mon Apr 01, 2024 9:50 am]
InvisibleAerobar wrote: Mon Apr 01, 2024 9:50 am
Could someone provide a quick confirmation to my understanding of the following?

Fact pattern:

CUSIP:  912828T26
Duration held: to maturity, from 9/27/2022 to 9/30/2023
Item 1f (AMD):  $510

Based on my reading above, because I held the Treasury Note to maturity, the adjustment is the entirety of the AMD amount (but as a negative number).  As such, on Schedule D, I have $0 in gains, but would need to create a separate dummy 1099INT to report the $510 as interest.

Is my interpretation correct?

As an addendum, there was interest paid (accrued interest) to the party that previously owned this Treasury Note.  Where do I input information re: that?

Many thanks in advance!
[/QUOTE]

Correct.

Since you mention a dummy 1099-INT, I assume you are using tax software. There will be a box to check indicating that you need to make adjustments, and if you check that, one of the choices on the next screen will be something like "bought or sold bond between interest payments" (that's what it says in HRB). Check that box, and enter the accrued interest. You should see ACCRUED INTEREST ON Schedule B with a negative number, and that is subtracted from the other interest.

Put the interest in box 3 of the 1099-INT, so it will be subtracted from your state income.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bismarck23 wrote: Sat Mar 30, 2024 10:12 pm]
bismarck23 wrote: Sat Mar 30, 2024 10:12 pm
I have a second 1099-B entry, which is for the unreported t-bill sale. I entered it as "Short-term did not receive 1099-B form" which creates a second Form 8949 with Box C checked. But there's a problem making AAD adjustment. I'm not given an option for adjusting the basis because of an accrued acquisition discount. The only choice is a checkbox "The cost basis is incorrect or missing on my 1099-B", then I'm given an option to put in my "actual cost basis". But regardless of the value I put in that field, TurboTax does not make any adjustment to the cost basis. I think this is a software bug actually - when I mistakenly had Box B checked, it did adjust the cost basis using Code B (incorrect basis), which I'm not sure is correct. But TurboTax won't let me edit the forms directly, so as a work-around I just entered the adjusted cost basis on the first screen, so it appears on Form 8949 with no adjustment. Technically not correct, but the tax due is the same so it's the best I can do.
[/QUOTE]

Did you import your forms from Schwab?

As I shared in the link previously, the bills sold before maturity but not included in the 1099-B were imported into another section, which HRB calls "Sales of Collectibles and Other Investment Property". As I shared, this interview form allowed me to make an adjustment, which I entered as a negative number. It properly entered the values in form 8949, as it does for an accrued market discount adjustment, except with code "O" for other adjustment.

Note that with this approach there is no adjustment to basis--just an adjustment in the adjustment field of Form 8949.

TurboTax should have something similar.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pm
Here's what I did with each of these categories of income:

For the treasury bill that was sold before maturity and not reported on the 1099-B, I created a fictitious 1099-INT entry called "Schwab Accrued Market Discount" and put this interest on there in Box 3. That reports it federally and gets the state tax deduction. This was about $100, so I didn't bother trying to break out the income into accrued market discount and capital gains - I hope this isn't a mistake. Edit: I just did the math, and 55 cents of this income is capital gains, so I feel comfortable ignoring.
[/QUOTE]
You'll probably "get away" with this, since the end result is the same, but it is not the correct way to do it.

As I shared in the linked post, my Schwab 1099 had explicit instructions for the bills sold before maturity to "Report on Form 8949". I explained in that post how I did it.

Since the end result is that most of the accrued acquisition discount is reported as interest on Schedule B (via a dummy 1099-INT), what you did will be about the same in terms of tax owed, so there's no reason the IRS would issue a correction notice for this.

One technical note: bills have accrued acquisition discount, while notes and bonds have accrued market discount.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pmFinally, the 1099-B sales. I had five: three were for treasury notes that matured, and two were for t-note sales before maturity. For the three that matured, I just added up the accrued market discount (which was reported in box 1f), subtracted what was reported as Accrued Interest Paid elsewhere on the 1099, and added that to the "Schwab Accrued Market Discount" 1099-INT in box 3.
[/QUOTE]

Again, same end result, but not the correct way to handle accrued interest paid to the seller.

There is a box you can check in the 1099-INT form to do do adjustments. In HRB it says, "Interest item requires an adjustment (uncommon)". I think in TT it says something about unusual situations; the online version says "I need to adjust the interest reported on my form.". On the next page in HRB one of the choices is "Bought or sold this bond between interest payments", and there will be something similar for TT; in the online version, you enter the accrued interest as a negative number, and select reason "My accrued interest is included in this 1099-INT. This is where you enter the accrued interest paid to seller. It appears on Schedule B with description "ACCRUED INTEREST" and a negative number in the AMOUNT OF INTEREST column.

I use separate 1099-INTs for accrued market discount and accrued acquisition discount, since they originate from different sections of the 1099, and the details of how they are handled is different.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pm
For the two sold before maturity, Schwab lists both an accrued market discount, AND a "realized gain or (loss)" - both had reported gains. My assumption here is that Schwab did the math for me.
[/QUOTE]

Note that you don't enter gain or loss--the tax software calculates it for you, so what Schwab shows in this column isn't actually entered into tax software. All that's entered into the 1099-B interview page are proceeds, cost and accrued market discount. This is what you'll see if you import the 1099 from Schwab.

If there's accrued market discount listed in box 1f of 1099-B for this sale, another interview page will be presented after the 1099-B page where you enter the accrued market discount adjustment, which is the lesser of the proceeds minus cost or accrued market discount. If proceeds minus cost <> AMD, then the difference is capital gain or loss. This all ends up on Form 8949, with the AMD adjustment in column g and the gain/loss in column h, and the totals are carried to the same columns in Schedule D.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pmAgain, I added the accrued market discount, minus Accrued Interest Paid, to the fictitious 1099-INT.
[/QUOTE]
Again, not the correct way to handle the accrued interest paid.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pmFor the capital gains, I reported to TurboTax a sale where the gross proceeds were the gross proceeds of the two t-notes (~$35k), and a cost basis of the gross proceeds MINUS the reported gain (about $90, so just under $35k). So I have $90 appearing as a short-term capital gain on Schedule D. Edit: I checked Schwab's math on accrued market discount vs. gains and got answers within a few dollars: $83 vs. $87, $5 vs. $7. I'll stick with Schwab's numbers.
[/QUOTE]

I don't "report sales" to my tax software. I simply enter what's on the 1099-B. I leave the proceeds and cost as reported on the 1099-B, as well as the accrued market discount in box 1f, and do the AMD adjustment as explained above. What you are doing is complicating things, and is incorrect.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pmThe only question I haven't been able to answer definitively is whether I'm able to get a state tax deduction on the $90 capital gain. Nowhere did I see an answer either way, but I'm not aware of any mechanism to deduct a capital gain on Schedule CA (as there are for interest and dividends), so I assume no. If there is, I would be happy if someone could share it.
[/QUOTE]

Capital gain, regardless of whether it's from Treasuries or not, is not deductible from CA state income. If you enter the 1099-B and do the accrued market discount adjustment as I've explained, you'll end up with the correct capital gain or loss on Schedule D. You do need to enter the AMD adjustment amount into box 3 of the dummy 1099-INT to ensure that it is deducted from CA income.

[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 3:51 pm]
bismarck23 wrote: Thu Mar 28, 2024 3:51 pmIf any of this doesn't sound right, please let me know. Thanks again!
[/QUOTE]
Done!

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bismarck23 wrote: Thu Mar 28, 2024 12:54 am]
bismarck23 wrote: Thu Mar 28, 2024 12:54 am
I'm working on my 2023 return and I have a bunch of questions about bonds I am hoping to tap the collective expertise of the forum here. I'm a CA resident using TurboTax Deluxe.

I bought and sold some treasury bills and notes before they matured. These transactions were reported on a 1099-B. 

1) Even though the income is technically capital gains, it's still exempt from state taxes, correct? 
2) Does it get reported as capital gains on Schedule D, or interest on Schedule B? When I entered the 1099-B it's currently on Schedule D.
3) Some of these bonds had an accrued interest paid. What is the proper way to subtract the accrued interest paid using TurboTax?

I also held some treasury bond containing mutual/money market funds (eg. SNSXX). This income was reported as a dividend.

4) What is the correct way to exempt this income from state taxes? In TurboTax on the California page, there is an "Interest and Dividends Adjustment" there us is just a generic table for interest adjustments and another for dividend adjustments. Is this the correct place?

For some reason, one transaction (buying some T-bills and selling them at a ~$100 profit before maturity) are listed on my composite 1099 from Schwab, but aren't in the 1099-B section. 

5) Why is this transaction not included in the 1099-B when the rest were?
6) How do I report this transaction in TurboTax?

Thanks very much!
[/QUOTE]

First, did you read the OP of this thread? It describes the basics of tax reporting for notes/bonds and bills. For example, it explains that how to handle the accrued market discount for notes/bonds reported in box 1f of 1099-B, which it seems you don't understand.

It's important to distinguish between notes/bonds and bills, since they are handled completely differently in tax reporting. 

Next, there is a link in the OP to a post in which I describe in detail how sales of Tbills before maturity was handled by HRB for a Schwab 1099: How to report gain/loss and interest for Tbills sold before maturity . TT will be a bit different, but it should be similar.

I recommend that you read at least those posts, then come back with followup questions that those posts don't answer.

RE: the SNSXX question, in HRB there is a checkbox in the 1099-DIV federal interview screen labeled "From US Treasury Obligations". If you check that box, on the next screen you enter the percentage of income reported on the 1099-DIV that is from Treasuries. TT should have something similar. The tax software uses the info in the fed interview to enter the appropriate subtraction amount on Schedule CA (540).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Merry wrote: Mon Mar 25, 2024 2:56 pmKevin M wrote: Tue Nov 15, 2022 7:26 pm]
Merry wrote: Mon Mar 25, 2024 2:56 pm
Kevin M wrote: Tue Nov 15, 2022 7:26 pm

Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.

Kevin

Hello, I've been keeping up with this topic because for tax year 2023 I have to file for the first time proceeds from treasury notes. I do my tax returns by hand. I received my 1099-B from Fidelity that shows the short-term transaction gain with a note that Form 8949 is to be filed and/or Schedule D, Part I. When I complete Form 8949, with box A checked, it says to include the total on Schedule D line 1b. When I complete part 1 of Schedule D, it then subtracts that gain from the capital loss carryover I have and says nothing about using Schedule B to report the proceeds as interest. This isn't a bad situation (if it's correct) because I do have quite a bit of capital loss carryover to be reduced and if I don't need to pay the taxes as interest then my taxes would be less. I'm confused about why I wouldn't follow the instructions provided by Fidelity and the IRS and how I'd make the connection to using Schedule B interest instead? Thanks very much for the help!
[/QUOTE]

You are not following all of the details. At the bottom of form 8949 you see the totals: proceeds, cost/basis, adjustments, and below adjustments, net gain or loss. All four of these numbers are transferred to Schedule D line 1b, in columns d, e, g and h respectively. The number in column h is the gain/loss. Your short term capital loss carryover is also in column h (of line 6), and it is combined with the gain/loss in column h of line 1b.

Note that although the total market discount adjustments appear in column g of Schedule D, nothing is done with it on that form. It is up to the tax preparer to understand that the accrued market discount is entered as interest on Schedule B.

One advantage of using tax software is that you get some guidance on this without having to read all the form instructions and IRS publications in detail.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Sun Mar 24, 2024 2:07 pmAQ wrote: Mon Feb 12, 2024 5:06 pm]
SlowMovingInvestor wrote: Sun Mar 24, 2024 2:07 pm
AQ wrote: Mon Feb 12, 2024 5:06 pm
A data point about entering Accrued Market Discount for State tax filing. I'm using TurboTax 2023 Home&Business. 

I bought 2 Treasury bonds on secondary market and held to maturity. Fidelity 1099B reports the difference between purchase price & par as AMD. 

TT offers two ways to enter 1099B. The 'summary' approach won't work for AMD. So I entered the numbers for trades one by one. There is a button you could select to enter AMD to box 1F. Then TT will report capital gain = 0 on form 8949, and AMD as interest income on Schedule B. So no dummy 1099-INT needed. 

However, the State tax part doesn't treat this AMD as government obligations and charge me state tax (I'm a CA resident). 

When I played State Tax part, there is a radio 'Interest/Divdend adjustment' under heading 'Investment'. But none seem fitting what I needed to do. After hitting 'continue' there is a catch-all screen 'other adjustment' where we can make 'subtraction' or 'addition' to Interest. I entered AMD there and bingo, my state tax reduced respectively. 

Not sure if this is the proper way but it's one way to get the tax amount right.

p.s. I always hesitate to manually work on FORM mode and prefer to get things done with 'step-by-step'. Whenever I manually edit a tax form, TT always asks me to mail materials to IRS and sometimes not let me do e-filing..

Hello

I'm dealing with something similar, except that I downloaded the Fidelity 1099 into Turbo Tax Desktop rather than entering it manually (which is what I infer you did). 

I have an entry showing the AMD as interest income (as you describe) on my Schedule B. However, this entry is unlike other Schedule B entries in that I can't find any way to edit it from Turbo Tax Step By Step.
[/QUOTE]
That's because TT made the entry, so this is no surprise.

[QUOTE: SlowMovingInvestor wrote: Sun Mar 24, 2024 2:07 pm]
SlowMovingInvestor wrote: Sun Mar 24, 2024 2:07 pmThe steps you describe that you carried out (in bold italics above) don't show up on either my Fed or State return in the step by step interview.

Did they show up on your state step by step interview or your federal interview? If it's the state interview, it's possible the interview is different for different states since I don't see it (I'm not a CA resident). The only way I could get the state return to exclude this income was to drop to Forms mode and designate it as non-taxable at the state level. Like you, I don't like using Forms mode, so I'd prefer to see if another method was available. 

Thanks!
[/QUOTE]

I'm not AQ, and I use HRB not TT, but from what he posted he did this in the state interview, which makes sense.

Yes, the interview is going to be different for each state since each state has different tax laws.

Sometimes using Forms mode is the only way to get things done, and in that case, that's what you must do. I had a situation for family members with estate K1 forms, where entering one of the values precluded e-filing the fed tax return, and ditto for the state tax return. In addition, the only way I could find to make one of the subtractions for state taxes was to use a catch all field available on the state adjustments form, since there was entry into the subtraction column for the specific item was not allowed. And for another one of the state entries the only way to make the appropriate adjustment was to override the HRB value.

I considered simply not entering the K1 data, and just let the IRS and state tax authority send out correction notices if they caught it, but there were significant deductions due to the K1s that saved them a few hundred dollars in taxes, so I thought that was worth mailing the tax forms. The family members agreed.

Also, there are some less common situations where the interview instruction in HRB is to open the form and make the entries on it, so in these situations using forms mode is unavoidable. Also, during the accuracy check, some of the issues are fixed by making an entry into a form.

Other than the weird K1 situation, the only time I've seen entering something in forms mode preclude f-filing was when a field is overridden. You can do much of the tax return in forms mode if you want, since answering the interview questions makes entries in the forms anyway.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: protagonist wrote: Fri Mar 22, 2024 1:29 pm]
protagonist wrote: Fri Mar 22, 2024 1:29 pm
I don't trust the broker pricing used for gain/loss
Isn't that the same number quoted in Fidelity's end of year tax reports that they report to the IRS?
[/QUOTE]

I just meant with respect to the actual gain or loss. As I showed, the actual loss would be a bit smaller based on the actual bid price at the time I looked. But as I said, it's in the same ballpark.

The number that would be reported on the 1099-B would be based on the actual sales proceeds, not whatever Fido shows on the Positions page at the time of the sale. The only end of year tax document can think of that has any bearing on income taxes is the 5498, but that's only relevant to IRAs, as it documents the Dec 31 value that's used to calculate the RMD.

[QUOTE: protagonist wrote: Fri Mar 22, 2024 1:29 pm]
protagonist wrote: Fri Mar 22, 2024 1:29 pmA difference in maturity of at least three months is a significant difference.
How is this more significant than what you will be doing when you sell your 2034s to buy 2035s next year?   In your case, the difference will be at least 6 and maybe 12 months.   Not to mention the 2040s you sell to closer approximate the YTM.
(Or were you referring to the legality issue?   Upon rereading I think this is probably what you meant...I read it to mean a significant financial difference).
[/QUOTE]
Yeah, just supporting your contention that it's not a wash sale, because they are different securities with different maturity dates. It would make little if any difference to me in terms of TLH.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: protagonist wrote: Fri Mar 22, 2024 10:30 amKevin M wrote: Fri Mar 22, 2024 10:23 amprotagonist wrote: Tue Mar 19, 2024 1:05 pm]
protagonist wrote: Fri Mar 22, 2024 10:30 am
Kevin M wrote: Fri Mar 22, 2024 10:23 am
protagonist wrote: Tue Mar 19, 2024 1:05 pm
This is probably a naive question, but....

Can you do creative tax loss harvesting with TIPS, by selling any TIPS that have lost value relative to cost basis and buying TIPS with similar , but different, maturities?

EXAMPLE:
Hypothetically, say your (adjusted) cost basis for Jan. 2033 TIPS is $100K, and their current value is $95K .
You sell your Jan 2033 TIPS, realizing a $5K loss.
You then buy $95K worth of July 2033 TIPS with the proceeds.
The only real cost to your portfolio is small bid/ask spreads (and maybe a small difference in YTM), but you get to claim a $5K loss on your taxes.
You could do that with all of your TIPS that are selling at a loss, if there are other fairly similar TIPS with close maturity dates and close yields.

I think I am probably missing something here....it seems too easy, and I have not read about people doing this.

The Regulations:

Reg Sec 1.148-4(b)(2)(ii) states that “Generally, bonds are substantially identical if the stated interest rate, maturity, and payment dates are the same.”
In the above component chart, stated interest rate would correspond to coupon rate, maturity would correspond to maturity date and payment dates would be a component of how the stated interest rate is implemented.
Therefore, the converse must also be true, that if those components are materially different or maybe even marginally different, the bond would not be substantially identical."
https://www.optionstaxguy.com/substanti ... onds-v-opt

I can't think of a reason not to do this.

If one can legally bypass wash sale rules, it seems like a HUGE advantage to me, and one that should be pursued by those with a TIPS ladder on a regular basis.   Especially in times like now, when yields are high, and many of us are probably experiencing substantial unrealized losses.

Are you doing it (in taxable accounts)?   And if not, why not?
[/QUOTE]

As you've pointed out, I see no risk of this being considered a wash sale. A difference in maturity of at least three months is a significant difference.

All of my TIPS are in my IRA, but I had not thought about it for the family and friend accounts I manage that have TIPS in taxable. Looking now ...

I don't trust the broker pricing used for gain/loss, and I'll follow up on that in a minute, but I see mostly gains in the taxable accounts with lots of TIPS, and the losses are not very big. In one of these accounts, I see only one loss of about $30. In another a couple of losses of less than $100.

The largest loss I see in the positions page for one account is -776.72. Calculating this myself using the actual bid price right now at Fidelity for the quantity held, I get -735.31, so in the same ballpark. I used Fidelity cost basis number.

The thing is that the owner of this account has a large capital loss to carry forward--one that's enough to last his lifetime at $3,000/year, so the benefit of harvesting this relatively small loss is minimal at best. I probably won't bother.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: protagonist wrote: Tue Mar 19, 2024 1:05 pm]
protagonist wrote: Tue Mar 19, 2024 1:05 pm
This is probably a naive question, but....

Can you do creative tax loss harvesting with TIPS, by selling any TIPS that have lost value relative to cost basis and buying TIPS with similar , but different, maturities?

EXAMPLE:
Hypothetically, say your (adjusted) cost basis for Jan. 2033 TIPS is $100K, and their current value is $95K .
You sell your Jan 2033 TIPS, realizing a $5K loss.
You then buy $95K worth of July 2033 TIPS with the proceeds.
The only real cost to your portfolio is small bid/ask spreads (and maybe a small difference in YTM), but you get to claim a $5K loss on your taxes.
You could do that with all of your TIPS that are selling at a loss, if there are other fairly similar TIPS with close maturity dates and close yields.

I think I am probably missing something here....it seems too easy, and I have not read about people doing this.

The Regulations:

Reg Sec 1.148-4(b)(2)(ii) states that “Generally, bonds are substantially identical if the stated interest rate, maturity, and payment dates are the same.”
In the above component chart, stated interest rate would correspond to coupon rate, maturity would correspond to maturity date and payment dates would be a component of how the stated interest rate is implemented.
Therefore, the converse must also be true, that if those components are materially different or maybe even marginally different, the bond would not be substantially identical."
https://www.optionstaxguy.com/substanti ... onds-v-opt
[/QUOTE]

I can't think of a reason not to do this.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Wed Mar 20, 2024 1:01 am]
ginahoy wrote: Wed Mar 20, 2024 1:01 am
Based on what others reported in this thread, Schwab isn't the only broker that reports the entire gain in Box 3f.
[/QUOTE]

I sold lots of Treasuries before maturity in 2019 at Schwab. The accrued market discount did not equal the proceeds minus cost/basis for most of them (it did for one of them). Example:

Proceeds: 9,941.80

Cost: 9,914.00

Accrued market discount (box 1f): 25.61

Realized gain or (Loss): 2.19

Note that proceeds minus cost is 27.80, and that 27.80 - 25.61 = 2.19.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Wed Mar 20, 2024 1:01 am]
ginahoy wrote: Wed Mar 20, 2024 1:01 am
Based on what others reported in this thread, Schwab isn't the only broker that reports the entire gain in Box 3f.  I recall some discussion over the course of this thread about the need to create dummy 1099-INT's to get the correct result in tax software.
[/QUOTE]

With HRB at least, you always need to create a dummy 1099-INT to report the AMD adjustment amount as interest. This has nothing to do whether the amount in box 1f is correct or not.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Tue Mar 19, 2024 12:48 amKevin M wrote: Mon Mar 18, 2024 2:55 pm]
ginahoy wrote: Tue Mar 19, 2024 12:48 am
Kevin M wrote: Mon Mar 18, 2024 2:55 pmI don't think this is correct. The understanding you state in your first sentence is incorrect. Accrued market discount is exactly that, and has nothing to do with the sales proceeds.
I see where I erred.  Because the "Box 1f" amount on my Schwab 1099-B (labeled as Accrued Market Discount) equals the Proceeds (Box 1d) minus the Cost (Box 1e), I mistakenly assumed AMD represented total gain.  In reviewing Pub 550 once again, I see that AMD and RMD are essentially the same. (i.e., RMD is one of two approved methods for calculating AMD). 

But this doesn't negate my point that Box 1f Accrued Market Discount as listed on my 1099-B is incorrect (this is what I was referring to when I said it's been discussed ad nauseam in this thread). In order to follow Pub 550's reporting requirements, I must calculate and enter the correct AMD in 8949 column g, and the difference (which represents a capital gain or loss), goes in column h. My mistaken terminology totally obfuscated my point. My apologies
[/QUOTE]

Are you sure it's incorrect? It's not unusual for acc mkt disc to equal proceeds minus cost, although it doesn't always. On a Vanguard 1099-B I dealt with, there were five bonds with amd, and for all but one of them amd equaled proceeds minus cost.

Personally, I don't do my own calculations for amd--I just use whatever the broker supplies. If it doesn't equal proceeds minus cost, the difference is small--small enough that I'm not concerned whether or not it's exactly correct.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Mon Mar 18, 2024 2:28 pmKevin M wrote: Mon Mar 18, 2024 8:41 amFactualFran wrote: Mon Mar 18, 2024 12:59 pm]
ginahoy wrote: Mon Mar 18, 2024 2:28 pm
Kevin M wrote: Mon Mar 18, 2024 8:41 amI don't think ofckrupke meant that the split between amd and cg is shown on the 1099-B. As you noted, it's something we must do ourselves.
OK, I must have read too much into ofckrupke's post. I understood his comment "Proceeds less basis is split between..." was referring to his Schwab 1099-B presentation. 
FactualFran wrote: Mon Mar 18, 2024 12:59 pmA Form 8949 filed with the income tax return should have what is on the 1099-B for the sale with "D" in the adjustment code column and the accrued market discount on the 1099-B in the adjustment amount column.
My understanding of the term 'accrued market discount' (AMD) is that it refers to the difference between cost or basis and the sale proceeds. However, when a note or bond is sold prior to maturity and the ratable market discount (RMD) is different from the AMD (almost always the case unless sale price happens to exactly align with original YTM), the AMD must be split between RMD and capital gain (or loss). Since Schwab's 1099-B only lists AMD in this case, it's incumbent upon the taxpayer to manually calculate RMD and enter in column g, code D (flows to Sch B) with the difference in column h (flows to Sch D). But this has already been thoroughly discussed, ad nauseam, in this thread.
[/QUOTE]

I don't think this is correct. The understanding you state in your first sentence is incorrect. Accrued market discount is exactly that, and has nothing to do with the sales proceeds.

What you do is enter the lesser of the AMD or proceeds minus cost as the AMD adjustment, and whatever is left is capital gain or loss. I did a return where there were five 1099-B entries with AMD. In every case the proceeds minus cost was less than the AMD. If what you said were true, they would be the same.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ginahoy wrote: Mon Mar 18, 2024 12:52 amofckrupke wrote: Sun Feb 25, 2024 3:47 pm]
ginahoy wrote: Mon Mar 18, 2024 12:52 am
ofckrupke wrote: Sun Feb 25, 2024 3:47 pmPre-maturity sales of notes (and bonds, I presume) ARE reported by Schwab on 1099-B. Proceeds less basis is split between accrued market discount and capital gain
I just saw this... That wasn't my experience. I sold two T-notes prior to maturity last year and my Schwab 1099-B put the entire gain in box 1f, with "0" in the Realized Gain or (loss) column. I calculated the 'ratable market discount' and entered in the adjustment column g (f8949), with the difference in gain/loss column h.
[/QUOTE]

I don't think ofckrupke meant that the split between amd and cg is shown on the 1099-B. As you noted, it's something we must do ourselves.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bon
			
[QUOTE: FactualFran wrote: Sun Mar 17, 2024 12:13 pmParkinglotracer wrote: Sun Mar 17, 2024 11:06 am]
FactualFran wrote: Sun Mar 17, 2024 12:13 pm
Parkinglotracer wrote: Sun Mar 17, 2024 11:06 am
It is listed on my vanguard 1099-INT under items not reported to the IRS.

Accrued interest paid is not listed on either Form 1099-INT at the IRS website (https://www.irs.gov/pub/irs-pdf/f1099int.pdf) or on the Form 1099-INT part of the tax reporting statement that I have from a brokerage other than Vanguard.  I don't have a brokerage account at Vanguard with bonds on which accrued interest was paid.
[/QUOTE]

Accrued interest is not on the actual 1099-INT. As pointed out, it's in a supplementary section not reported to the IRS. Fido and Schwab also report accrued interest in a supplementary section.

Since it's not actually on the 1099-INT, it's not imported into tax software, which is why you need to handle it yourself.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Drew31 wrote: Fri Mar 15, 2024 12:02 pm]
Drew31 wrote: Fri Mar 15, 2024 12:02 pm
Been doing some reading on impact of buying an individual bond (treasury, TIPS specifically) in a taxable account at a bond premium.  Not done that before so wanted to make sure I understood implications.

Seems to me, that tax impact is pretty straightforward.  I'll get interest in box 1 on my 1099 each year, then in box 11 I'll see a bond premium amount from my brokerage that will offset some of the interest paid and this will go on each year I hold the bond or until maturity.  And the brokerage handles all the calculations and input.  

Seems like a non-issue to me and no hassle at all....but...thought I'd post here first in case I'm missing something
[/QUOTE]

Kind of.

Bond premium on US Treasury obligations in Box 12 of the 1099-INT (not box 11). With HRB, we need to enter this amount on the amortizable bond premium adjustment page, which appears after you click Next on the 1099-INT data entry page. The ABP adjustment page appears even if you don't click the box in the 1099-INT page that indicates an adjustment is needed.

However, if you also need to make an adjustment for accrued interest paid to the seller, which is likely for the tax year in which you bought the bond (or received the first coupon, if you want to do it that way), you'll need to do a little extra work, because HRB does not let you do more than one adjustment per 1099-INT.

I documented how I handle this situation in this post last week.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: How to report gain/loss and interest for Tbills sold before maturity
			
[QUOTE: henryphseven wrote: Sun Mar 10, 2024 5:29 pmKevin M wrote: Sun Mar 10, 2024 5:17 pmhenryphseven wrote: Sun Mar 10, 2024 5:08 pm]
henryphseven wrote: Sun Mar 10, 2024 5:29 pm
Kevin M wrote: Sun Mar 10, 2024 5:17 pm
henryphseven wrote: Sun Mar 10, 2024 5:08 pm
Thank you Kevin M. Unfortunately, my case is different from your case because all the gain from selling T-bill before maturity appears in 1099-INT. None appears in 1099-B. Instead of being able to enter the correct interest amount in 1099-INT interview, we will have to enter the wrong amount and make an adjustment to it.

What broker is this? I would like to see the entire composite 1099 to see if there is something you might be missing.

Assuming you are telling the whole truth and nothing but the truth, I would just leave it as is, and report the interest on 1099-INT. Your broker made it simple for you, so why complicate things?

The IRS will get the 1099-INT, and it will match what you report on your return, so the IRS will be happy.

Any difference between the accrued acquisition discount and the proceeds minus cost is likely to be very small, so should have no material impact on your taxes.

Hi Kevin M, yes that was my initial thought when I posted viewtopic.php?p=7756632#p7756632, which was merged into this one by someone else. 

In my original post, I asked "all the gains from selling T-bills are reported in 1099-INT as Interest Income ... What is the consequence if I just use my broker's tax form to report my taxes instead of adjusting my 1099-B and 1099-INT manually?" And the follow-up responses seem to indicate that I should still modify my 1099-B and 1099-INT to report both capital gain and interest income from the sale.

My broker is Merrill and it seems that Fidelity also uses this approach: https://www.reddit.com/r/fidelityinvest ... it_income/

although the capital gain is small, it will affect the number of my state taxes.
[/QUOTE]

You're making a mountain out of a molehill. I would ignore anyone who says you should modify anything, and just do your taxes based on the 1099-INT as is.

I bet the odds of getting a correction notice from your state are are infinitesimal. All they have to go on is the 1099-INT.

And I'm saying that as someone who recently did get a correction notice from CA FTB for my 2019 taxes, but that had to do with them not factoring the amortized bond premium on tax exempt bonds into the interest taxable by the state. This is a much more arcane topic, and I don't want to divert the thread into it, since it has nothing to do with taxation of Treasuries, but I mention it for context.

Having said all of that, if you really want to separate out the gains from the interest, you can use an approach similar to what I documented, just switch things around. As you say, modify the 1099-INT amount to the correct amount, then enter the gain or loss using the sale of other investments section, or whatever your tax software uses for that. Note that either for your situation or mine, the amount of interest appearing on Schedule B will be different than the total on all 1099-INTs. Personally, I would not bother--the only reason I did it the way I did is that I had no choice because of the way Schwab reported it. Well, I guess I could have not reported it at all, since it wasn't reported to the IRS, but obviously I wasn't comfortable with that choice, but I would be totally comfortable just going with the 1099-INT if it had been reported that way.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: How to report gain/loss and interest for Tbills sold before maturity
			
[QUOTE: henryphseven wrote: Sun Mar 10, 2024 5:08 pm]
henryphseven wrote: Sun Mar 10, 2024 5:08 pm
Thank you Kevin M. Unfortunately, my case is different from your case because all the gain from selling T-bill before maturity appears in 1099-INT. None appears in 1099-B. Instead of being able to enter the correct interest amount in 1099-INT interview, we will have to enter the wrong amount and make an adjustment to it.
[/QUOTE]

What broker is this? I would like to see the entire composite 1099 to see if there is something you might be missing.

Assuming you are telling the whole truth and nothing but the truth, I would just leave it as is, and report the interest on 1099-INT. Your broker made it simple for you, so why complicate things?

The IRS will get the 1099-INT, and it will match what you report on your return, so the IRS will be happy.

Any difference between the accrued acquisition discount and the proceeds minus cost is likely to be very small, so should have no material impact on your taxes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

How to report gain/loss and interest for Tbills sold before maturity
			
[QUOTE: henryphseven wrote: Sun Mar 10, 2024 2:17 pm]
henryphseven wrote: Sun Mar 10, 2024 2:17 pm
if i need to add adjustment in Schedule B, what should I put in line 1? "Accrued Interest Adjustment"? Will IRS understand this part of interest income is re-characterized as capital gain?
[/QUOTE]

I went back to my 2019 return, since I sold a bunch of Treasuries, including bills, before maturity. I used HRB, and I'll use my Schwab 1099 as an example. I've discussed this several times in this thread, but I might not have gone into the details.

Schwab reported the "gains" in a section with this title and instruction:

[QUOTE]
Short-Term Realized Gain or (Loss)

The transactions in this section are not reported on Form 1099-B or to the IRS . Report on Form 8949, in either Part I with Box C checked or Part II with Box F checked, as appropriate
[/QUOTE]

It looks like these transactions got imported, based on  the descriptions, since they are not what I would have entered. The interview section in which the transactions appear is "Sales of Collectibles and Other Investment Property", which is different than the 1099-B interview section.

Each lot of bills (a specific maturity date) was entered into a "sale" interview page, which is like a 1099-B interview page, but different; there are not as many items, but the ones you need are there. The standard info is filled in; i.e., dates, proceeds, and basis. There is a drop-down labeled "Special type", in which I selected "O-Other adjustment". I don't remember how I settled on this code; looking through the codes for Form 8949, I don't see any other that would apply.

In the Adjustment field I entered the acquisition discount as a negative number, which I calculated in a spreadsheet; it's the number of days I owned the bill divided by the number of days from issue to maturity, multiplied by the face value minus the cost. In my spreadsheet I have an OID cost that is slightly different than my actual cost, and I don't remember how I came up with that, but I actually used that instead of my actual cost in calculating the accrued acquisition discount. I would probably just use actual cost if I didn't want to do the research again; the differences, where there were any, were very small. Whatever is left after subtracting the adjustment is the capital gain or loss.

This information from the sale interview page is recorded on a Capital Gains and Losses Worksheet; there is one worksheet per sale entered in this section, and one worksheet for each 1099-B entry, so the same worksheet is used for both.

The data is transferred to 8949 Copy 3, which has box C checked, Short term transactions not reported on form 1099-B. The far right column for each sale shows the adjustment (negative number), and below that the net gain or loss (proceeds minus cost plus adjustment). The column to the left of the adjustment amount shows the code "O". Note that code "D" is entered for accrued market discount reported in box f of 1099-B, but that is entered by HRB.

To report the interest, I manually entered an "Other interest" page in the 1099-INT interview section; I probably could have just used a 1099-INT page, but for some reason I didn't in this case. I entered "Schwab US Tbill interest" for the description, and entered the total accrued acquisition discount for all bills in box 3.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Report Gain from Selling T-Bill as Interest Income?
			
[QUOTE: FactualFran wrote: Fri Mar 08, 2024 10:48 pmhenryphseven wrote: Fri Mar 08, 2024 9:26 pm]
FactualFran wrote: Fri Mar 08, 2024 10:48 pm
henryphseven wrote: Fri Mar 08, 2024 9:26 pm
It seems that treating all gains as ordinary income is not consistent with IRS rules.

Treating the difference between the purchase price and the sale price as ordinary income is consisting with IRS rules when the purchase price was lower than the sale price and the difference is not more than the ratable share of the acquisition discount.  If the difference is more than the ratable share, then the excess over the ratable share is a capital gain.
[/QUOTE]

Right. This has been discussed a length in this thread, and resolved definitively, so it's kind of unfortunate to see all the thrashing about regarding it in the thread that was merged into this thread.

You can search this thread for "accrued acquisition discount" to see the discussions about it.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: liverpool wrote: Sat Mar 09, 2024 9:04 am]
liverpool wrote: Sat Mar 09, 2024 9:04 am
I purchased 3 Treasury bonds on the secondary market in my taxable account in 2023 as follows:

1) Maturity: 7/31/2024
No interest received in 2023
Accrued interest paid in 2023: $80.84

2) Maturity: 2/29/2024
Interest received in 2023: $427.50
Accrued interest paid in 2023: $6.97

3) Maturity: 5/15/2024
Interest received in 2023: $93.75
Accrued interest paid in 2023: $42.80

The accrued interest is shown on my form 1099 as not reported to the IRS.

My question is do I need to reflect the accrued interest in my 2023 return, or does this form part of the interest/capital gain on my 2024 return when these bonds mature?

Thanks in advance!
[/QUOTE]

This has been discussed at length. Since your total interest is greater than the accrued interest paid, I would deduct all of the accrued  interest paid in 2023 as an adjustment to the 1099-INT in which you report the interest. This is what I do. The only reason I carry any of it over to the next year is if I don't have enough Treasury interest to cover the accrued interest paid.

Technically, it could be that you should only deduct the accrued interest if you received an interest payment for that particular bond, but I'll buy you a beer if you do it the way I recommend and you get a correction notice from the IRS.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			Here's what I do if there's both accrued interest and amortized bond premium for a 1099-INT; I'll use a Vanguard 1099-INT as an example. As a reminder, you can only do one adjustment per 1099-INT in HRB, so it requires two 1099-INTs to do this.

In the Detail for Interest Income, Vanguard provides this summary:

Code: Select all10,763.23	Total Interest
  -869.08 	Total Accrued interest paid
-2,062.64	Total Bd premium- covered lots

I enter it into a spreadsheet this way:
Code: Select allVanguard		Interest	Bond premium	Accrued interest
1099-INT original	10,763		2,063	
1099-INT for acc int	1,000				869
1099-INT for ABP	9,763		2,063	

Data row 1 shows the entries on the 1099-INT as downloaded from Vanguard. The interest is in Box 3, since it's all UST interest.

Row 2 shows what I enter on a separate 1099-INT to do the accrued interest adjustment. I enter enough interest in Box 3 (UST interest) to cover the accrued interest, and in this case, just rounded up to the closest $1K. Note that I enter the interest into Box 3 since it's UST. It's easy to enter it into Box 1 by mistake if moving quickly without thinking--I just did this, and caught it as I was writing this. The only reason to enter it into the box 3 instead of box 1 is so that the correct amount of UST income is excluded from taxable state income.

Row 3 shows the modified amounts entered into the original 1099-INT. Note that the Box 3 amount is the original minus the amount entered for the acc int adjustment.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			I think I mentioned that the Vanguard 1099 download downloads a form 1099-OID form for each TIPS. Although it's simple to just click through each one, it's faster to delete them all except one (one click per delete) and enter the total OID in the one remaining form. I've done it both ways, and I prefer the second way.

Fidelity downloads the total OID into one form--makes much more sense.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bog007 wrote: Mon Mar 04, 2024 12:31 pmBlues wrote: Mon Mar 04, 2024 7:56 am]
bog007 wrote: Mon Mar 04, 2024 12:31 pm
Blues wrote: Mon Mar 04, 2024 7:56 am
I used FreeTaxUSA to file my federal and state returns for 2023.

After you input the data from the 1099-B into the software, during the "interview" process the software asks if there are any adjustments to be made. You select the relevant response from the options provided, (regarding accrued market discount), and it will automatically list the income as interest on Schedule B.  

It was harder to write this than it was to accomplish the simple entry on the software.

ok not sure the difference between accrued market discount and accrued interest. guess i didnt have accrued interest this year. my tax form just shows accrued market discount and it looks like it goes to 1f
[/QUOTE]

Market discount is the difference between the price you paid and 100. So if you pay 98, or 980 per bond, the market discount is 20 per bond. If you hold to maturity, the bond matures at 100, or 1,000 per bond, and you have 20 of accrued market discount. Acc mkt disc shows up in box 1f of 1099-B, and you do an adjustment to lower or eliminate the cap gain on Schedule D and move the acc mkt disc to Schedule B as interest. The acc mkt disc adjustment is done as part of entering the 1099-B into tax software.

Accrued interest is the interest that has accrued from the previous coupon date to the settlement date of your purchase, and that you pay to the seller. It should be listed somewhere on the broker's consolidated 1099. Vanguard shows it right along with the interest in the interest details section. Schwab and Fidelity include it in a separate section, Accrued Interest Paid on Purchases.  The acc int adjustment is done as part of entering the 1099-INT into tax software.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Sun Mar 03, 2024 5:27 pm]
hghysm21 wrote: Sun Mar 03, 2024 5:27 pm
p550 p.49 - Discounted Debt Instruments
Treat your gain or loss on the sale, redemption, or retirement of a bond or other debt instrument originally issued at a discount or bought at a discount as capital gain or loss, ....

Thanks. Which type of bonds qualify what said above, so their market discount can be treated as capital gain?
[/QUOTE]

For most of what we deal with, "except as explained in the following discussions", which you didn't include in your Pub 550 quote above, does not necessarily refer to different types of bonds; it also refers to what part of the gains are treated as ordinary income. Here are the two "except as explained" things we deal with most often:

[QUOTE]
Short-term government obligations.

Treat gains on short-term federal, state, or local government obligations (other than tax-exempt obligations) as ordinary income up to your ratable share of the acquisition discount.
[/QUOTE]
(underline mine)

and

[QUOTE]
Market discount bonds.

If the debt instrument has market discount and you chose to include the discount in income as it accrued, increase your basis in the debt instrument by the accrued discount to figure capital gain or loss on its disposition. If you did not choose to include the discount in income as it accrued, you must report gain as ordinary interest income up to the instrument's accrued market discount.
[/QUOTE]
(underline mine)

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Sun Mar 03, 2024 11:41 am]
hghysm21 wrote: Sun Mar 03, 2024 11:41 am
(Sorry about my post format. I don't know how to do it right.)
hghysm21 wrote: Sat Mar 02, 2024 6:14 pm1. 
My old questions:
1. Is there any bond, regardless of issue date, is considered short term bond, as long as it matured within 1yr from the date of purchase?
2. If market discount needs to be reported as interest, why the brokerage firms list them as short term capital gains?
Kevin's post:
1. What is it about my previous answer that you don't understand?
2. I assume this is what the IRS requires. I have no idea why, and I don't really care. All that's important is knowing how to handle it.

My new questions:
Thanks.
I just want to know:
(a) Do Short Term Bonds include EXCLUSIVELY those matured, etc within 1 yr from their ISSUE date, not from their PURCHASE date?  Any exceptions?
(b) If there are exceptions, what are they?
[/QUOTE]

Again, please quote my answer and tell me what you don't understand about it.

This is a taxation thread, so for the purpose of taxation, only Treasury bills are short term Treasury obligations, since these are the only ones issued with a maturity of less than one year.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Walkure wrote: Sat Mar 02, 2024 5:43 pm]
Walkure wrote: Sat Mar 02, 2024 5:43 pm
Okay, just a check to make sure I'm doing this correctly here.  I purchased some STRIPS last fall with about 20 years to maturity.  Vanguard reports the 1099-OID for all of these bonds.  However, due to screwing up a few buys, I did sell a few of the bonds within a couple of days of purchase to get back to the right ladder rungs.

All of these sales were for a slight gain (no wash sale issues!)  On the 1099-B "SHORT TERM TRANSACTIONS FOR COVERED TAX LOTS" section, it reports the purchase basis and sale proceeds.  The reported gains are the entire difference between these two values.  However on the right under "Additional information" it reports "Original basis."  These numbers are slightly less than "Cost or other basis" reported in box 1e, and they appear to be less by the amount of the OID reported on the same CUSIPs on the 1099-OID.  So it seems like even though I received no coupon (obviously) and sold for a short term gain, I have to first report the (very small due to the couple of days they were held) OID as imputed interest, add it to my purchase basis, and then only report the ST capital gain on the proceeds-adjusted basis.

That is the straightforward outcome of simply typing the boxes into my tax software as presented, but looking for a gut check that I'm not overlooking something important.
[/QUOTE]

This sounds correct to me.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Sat Mar 02, 2024 6:14 pm]
hghysm21 wrote: Sat Mar 02, 2024 6:14 pm
1.	Is there any bond, regardless of issue date, is considered short term bond, as long as it matured within 1yr from the date of purchase?
2.	If market discount needs to be reported as interest, why the brokerage firms list them as short term capital gains?
[/QUOTE]

1. What is it about my previous answer that you don't understand?

2. I assume this is what the IRS requires. I have no idea why, and I don't really care. All that's important is knowing how to handle it.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Sat Mar 02, 2024 2:52 pm]
hghysm21 wrote: Sat Mar 02, 2024 2:52 pm
Thanks !!
I understand now that short term bond is the bonds matured within 1 yr from issue date. it is not the bonds matured within 1yr from purchase date.  Correct?
[/QUOTE]

If you're talking about what Pub 550 is referring to as "Short-term government obligations", then yes. So for tax purposes, it matters.

But generally I pay no attention to what the maturity date was when issued. I just buy whatever looks good at the desired maturity. Might be a bill, note or bond if less than one year left to maturity, but couldn't be a bill if more then one year left to maturity.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Sat Mar 02, 2024 1:35 pm]
hghysm21 wrote: Sat Mar 02, 2024 1:35 pm
Hi Kevin,
I’m new to this forum, notes bought on 2ndary market at discount, and taxation. Since t-bills are short term government obligation, so I wonder if my t-notes matured <1yr are also in that group.  Now I know my notes are not. Am I right?

Would you provide a link to your post about notes? Or, tell me how to get there?
Thanks!
[/QUOTE]

Correct: the tax treatment of bills is different than that for notes and bonds. IRS Pub 550 uses the term "short-term government obligations" for bills:

[QUOTE]
Short-term government obligations.

Treat gains on short-term federal, state, or local government obligations (other than tax-exempt obligations) as ordinary income up to your ratable share of the acquisition discount. This treatment applies to obligations with a fixed maturity date of not more than 1 year from the date of issue. Acquisition discount is the stated redemption price at maturity minus your basis in the obligation.
[/QUOTE]
(underline added for emphasis).

Treasury bills are the only type of Treasury that have a "maturity date of not more than 1 year from the date of issue".

I provided a brief summary of the tax treatment for each type of Treasury in the OP.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MisterMister wrote: Sat Mar 02, 2024 4:35 amhghysm21 wrote: Fri Mar 01, 2024 7:00 pm]
MisterMister wrote: Sat Mar 02, 2024 4:35 am
hghysm21 wrote: Fri Mar 01, 2024 7:00 pm
Kevin wrote “Bills are not considered market discount bonds, but are in a category of their own: short term US government obligations. The accrued acquisition discount is treated as interest,”

1.  I bought a treasury NOTE at discount on 2ndary market. It matured in the same year that I bought.  Is this type of treasury note considered “short term US government obligations “?  If not, can I treat the market discount as short-term capital gain? 
2. In 2023 Fidelity 1099-B, is the market discount already included in the cost basis? 

Thanks very much for your help.

See Kevin's very first post for more detailed explanations.

But for your specific case the answer to all your questions is no.  The accrued market discount (box 1f) still has to be treated as interest and not capital gain, and the cost basis is not adjusted by the discount.  Since it is not, you are probably showing a capital gain on 1099-B equal to the market discount.   That gain will need to be adjusted off (code D in 8949) and then added to your reported interest. The process by which this happens depends on what tax software you're using.  A key issue is whether the resulting additional interest is taxable in your state.  I know this topic is huge but there are already discussions on all that which flesh out all the issues.
[/QUOTE]

Correct.

hghysm21, not sure why you quoted something I said about bills when you are asking about a note. It would have made more sense to quote something I said about notes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=50

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hghysm21 wrote: Thu Feb 29, 2024 5:16 pm]
hghysm21 wrote: Thu Feb 29, 2024 5:16 pm
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Accrued market discount[/b] is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). [rest text skipped]

Looking at my 2019 1099s, I see that Schwab and Fidelity report it slightly differently.
[Table skipped]
Schwab shows the unadjusted basis, and subtracts accrued market discount to get the gain/loss. Fidelity shows the adjusted basis (accrued market discount added to basis), so gain/loss = proceeds - basis.

MY QUESTION:
Thanks Kevin for the above posting. I have several questions:
1.  Does what written above about Schwab and Fidelity cost basis etc only apply to long term t-notes? 
2.  2023 Fidelity 1099-B short term capital gain/loss, the market discount is NOT included in the cost bases. Am I right?
I’d appreciate your feedback.
[/QUOTE]

1. It applies to any note or bond; holding period does not matter.

2. In my experience, cost basis is not adjusted for market discount on the 1099. So calculate proceeds minus cost/basis, and if this is less than AMD, enter it as the adjustment, but don't enter less than 0; otherwise enter AMD as the adjustment.

You can verify this by looking at your transaction history, and noting that what you paid for the principal is what is reported as the cost/basis.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Vanguard OID, accrued interest, bond premium
			
[QUOTE: Kevin M wrote: Wed Feb 28, 2024 12:24 pm]
Kevin M wrote: Wed Feb 28, 2024 12:24 pm
There is both accrued interest and amortized bond premium reported for the 1099-INT I'm working on. You can make only one adjustment per 1099-INT. The downloaded 1099-INT has the bond premium in box 12, so I decided to leave the entire amount in box 3, and do the bond premium adjustment in this 1099-INT. I then manually created a dummy 1099-INT, entered 0 in Box 3 (you must enter something), and did the accrued interest adjustment for this 1099-INT. Even if you enter 0 in the 1099-INT, HRB still prompts you to enter an amount on the next page, but if you enter 0, it lets you move on to the adjustment page and finish the 1099-INT. In the past, I've split the interest up between the original and dummy 1099-INTs, but this time I thought I'd just try entering 0 in the dummy to see if it works.
[/QUOTE]

Although I got through the 1099-INT interview with this solution, HRB accuracy check flagged it as an issue that must be fixed before filing. So I subtracted some of the box 3 interest from the original 1099-INT and entered it in box 3 of the dummy, as I've done in the past (and now I remember why). This fixed the accuracy check error.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Vanguard OID, accrued interest, bond premium
			
[QUOTE: Kevin M wrote: Wed Feb 28, 2024 12:24 pm]
Kevin M wrote: Wed Feb 28, 2024 12:24 pm
VG reports accrued interest for each bond in the Detail for Interest Income section of the consolidated 1099. Not sure what they do if you paid the accrued interest the year before and did not receive an interest payment in the same year. I'll have to research that.
[/QUOTE]

I checked the VG 1099 for 2022 for this account, and I see that the accrued interest was reported in the Detail for Interest Income section for a TIPS that did not pay any interest in 2022. I verified that I made the adjustment for this accrued interest on the 1099-INT for 2022.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Vanguard OID, accrued interest, bond premium
			Thought I'd share a few things about Vanguard reporting of OID, accrued interest, and bond premium on the 1099 consolidated document, and how I handled it with HRB.

Vanguard reports OID for each TIPS separately, so you end up with a 1099-OID for each one if you import from Vanguard into HRB. All I did was click Edit, and step through it to remove the red check mark for each one. A couple of the TIPS had negative OID, so the number in box 8 was negative. This worked out fine, as these values end up as negative interest numbers on the Interest Income Summary worksheet, and correctly subtract from total interest.

VG reports accrued interest for each bond in the Detail for Interest Income section of the consolidated 1099. Not sure what they do if you paid the accrued interest the year before and did not receive an interest payment in the same year. I'll have to research that.

There is both accrued interest and amortized bond premium reported for the 1099-INT I'm working on. You can make only one adjustment per 1099-INT. The downloaded 1099-INT has the bond premium in box 12, so I decided to leave the entire amount in box 3, and do the bond premium adjustment in this 1099-INT. I then manually created a dummy 1099-INT, entered 0 in Box 3 (you must enter something), and did the accrued interest adjustment for this 1099-INT. Even if you enter 0 in the 1099-INT, HRB still prompts you to enter an amount on the next page, but if you enter 0, it lets you move on to the adjustment page and finish the 1099-INT. In the past, I've split the interest up between the original and dummy 1099-INTs, but this time I thought I'd just try entering 0 in the dummy to see if it works.

All of the above can be verified to be working correctly by checking the Interest Income Summary worksheet.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: kalarama wrote: Mon Feb 26, 2024 12:02 pm]
kalarama wrote: Mon Feb 26, 2024 12:02 pm
For 2023, I had 20+ T-bills sold early on Fidelity and they all are in 1099-INT with no supplemental information (ugh) and the transactions did not download automatically into TurboTax into form 8949.  So if I want to report accurately, do I need to create 20+ individual sales transactions in 8949/1099-B?  Ultimately it doesn't affect my overall return since it's all going to be short term capital gain/loss and doesn't result in using past carryover loss or carrying forward loss to future year.
[/QUOTE]

Interesting. Does the amount reported in 1099-INT equal the difference between the sales proceeds and cost? If so, I wouldn't worry about it.

Most of the difference between proceeds and cost is going to be accrued acquisition discount, which should be reported on 1099-INT anyway. There probably is a small difference between acc acq disc and proceeds minus cost, which should be reported on Schedule D, but I think the odds of the IRS catching or caring about that is 0.00001%.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: IDpilot wrote: Sun Feb 25, 2024 8:10 amKevin M wrote: Sat Feb 24, 2024 1:16 pm]
IDpilot wrote: Sun Feb 25, 2024 8:10 am
Kevin M wrote: Sat Feb 24, 2024 1:16 pm
Nothing is reported to the IRS for bills sold before maturity, so this is all on you to do. Contrary to what you state about Schwab, they did not report anything on Schedule B for bills sold before maturity on my 1099-B for 2019. So the IRS doesn't have anything to audit it against.

My Vanguard brokerage statement indicates that it reported date sold, description of property and proceeds to the IRS.  It did not report “Date acquired,” “Cost or other basis,” and “Gain or loss (-)” to the IRS on bills sold before maturity.
[/QUOTE]

Interesting. Thanks for sharing.

Either way, the way you are supposed report it is the same. The acquisition discount is reported as interest on Schedule B, and the remainder is capital gain or loss reported on Schedule D.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MisterMister wrote: Sat Feb 24, 2024 1:00 pm]
MisterMister wrote: Sat Feb 24, 2024 1:00 pm
The fourth choice, correctly mixing gains and interest as the statutes require, has not been documented here to my knowledge as something brokers do.
[/QUOTE]
It's not up to the broker to do it, it's up to you.

[QUOTE: MisterMister wrote: Sat Feb 24, 2024 1:00 pm]
MisterMister wrote: Sat Feb 24, 2024 1:00 pm
Moving part of the interest over to STCG is awkward since it requires either a replacement or an adjustment to Fidelity's 1099-INT.  The former would cause Fidelity's IRS-reported interest sum to differ from my revised value and the latter requires an adjustment line item.  I suppose either of those might be red-flagged by the IRS were the amounts not so tiny.
[/QUOTE]

It's common to need to make adjustments to interest, so there should be no issue with the Schedule B having different amounts than the 1099-INT. Two other examples are making an adjustment for accrued interest paid to the seller, and making an adjustment for accrued market discount reported on 1099-B. Both require making additional entries on Schedule B that are not on any 1099-INT.

Nothing is reported to the IRS for bills sold before maturity, so this is all on you to do. Contrary to what you state about Schwab, they did not report anything on Schedule B for bills sold before maturity on my 1099-B for 2019. So the IRS doesn't have anything to audit it against.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: rich126 wrote: Fri Feb 23, 2024 3:06 pm]
rich126 wrote: Fri Feb 23, 2024 3:06 pm
I'm thinking I might get hit with some penalties because I wasn't tracking the interest on bonds and it looks like I made over $22,000 in treasuries interest. A lot of it was on money I was holding for a house purchase. 

 I'll have to pay more attention in 2024 but won't have that huge chunk in a taxable account like I did in 2023.
[/QUOTE]

Huh? Didn't you receive 1099-INT and 1099-B forms from your broker showing any interest, capital gains, and accrued market discount on these Treasuries?

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Bwinner wrote: Fri Feb 23, 2024 2:42 pm]
Bwinner wrote: Fri Feb 23, 2024 2:42 pm
In July 2022 I bought a Treasury Bill on the secondary market through Ally Brokerage, selling in April 2023 (two months prior to maturity) for a $409 gain. I contacted Ally asking when I should expect to receive a 1099 and received the following response. "Thank you for your inquiry. We've been informed by our clearing firm that sales of T Bills are not required by the IRS to be reported on the 1099. This is why you did not received a 1099 for your account for tax year 2023."

Can I simply create a 1099-INT in FreeTaxUSA as if I received one from Ally, reporting the $409 in Box 3?
Will not having a 1099 cause any issues?
[/QUOTE]

I checked my 2019 1099 from Scwhab; I sold some bills before maturity that year. The only place numbers for those bills appeared was in a supplementary section not provided to the IRS.

Unfortunately, it's a little more complicated than what you describe. You need to calculate how much of the "gain" was accrued acquisition discount, which counts as interest income. Any remainder is capital gain or loss.

Having said that, the IRS is unlikely to audit you if you just report it all as interest, since the tax rates are the same for STCG and interest income. It could cause a small discrepancy for state income tax purposes, since Treasury interests is not taxable by the state, but STCG is. I doubt it's enough that your state tax agency would notice, especially since there is no 1099 for them to audit against.

The other minor issue could be if you have any capital losses that you could use to offset the small amount of capital gain, or capital gains you could use any small capital losses to offset. These amount probably are quite small.

Personally I would calculate the accrued acquisition discount and do it right. It's not that difficult.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: life_force_prana wrote: Fri Feb 23, 2024 2:15 pm]
life_force_prana wrote: Fri Feb 23, 2024 2:15 pm
A completely different question regarding TIPS.  In 2022, TIPS OID was $97.25 and in 2023, TIPS OID was $81.49, despite the fact that in 2023 I owned 25x the TIPS I owned in 2022.  I am confused about how the OID (phantom income) was almost identical despite owning a lot more TIPS in 2023. Is that primarily due to fact that inflation was much higher in 2022 than 2023?
[/QUOTE]

Yes, inflation was much higher in 2022 than in 2023.

Oct CPI sets the Jan 1 ref CPI, so Oct 2022 set the ref CPI for Jan 1, 2023. YoY inflation from Oct 2021 to Oct 2022 was 7.75%, so that was the inflation adjustment total for 2022.

YoY inflation fromm Oct 2022 to Oct 2023 was 3.24%, so that was the total inflation adjustment for 2023.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: life_force_prana wrote: Fri Feb 23, 2024 12:26 pm]
life_force_prana wrote: Fri Feb 23, 2024 12:26 pm
Ok so if I understand correctly, buying at reopen or secondary will both end up with non de-minimus discount, which will have to be reported when preparing 2034 taxes as an add to OID and interest income for 2034 taxes on Schedule B? Thanks.
[/QUOTE]

Correct. There will be a negative adjustment for the capital gain on 1099-B (lesser of market discount shown in box 1f or proceeds minus basis), and a corresponding positive interest entry that flows to Schedule B. With HRB we do the interest part with a dummy 1099-INT.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: gavinsiu wrote: Fri Feb 23, 2024 11:30 am]
gavinsiu wrote: Fri Feb 23, 2024 11:30 am
I have look through this thread but missed the answer. So the phantom income is reported on the 1099-OID. Is what is reported on 1099-OID taxable by the state? If I am using nominal bonds for example, the interest is exempt from state tax.
[/QUOTE]

The answer is in the OP. Take another look and let us know if you don't see it there. Don't look for the term "phantom income" though, because that's not what Treasury calls it.

I just checked a 2022 return that had Treasury interest and OID from TIPS, and verified that the sum of the interest and OID, less the accrued interest adjustment, appeared on the CA state tax return as a subtraction from income for US Treasury interest. This was done automatically by HRB tax software.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: life_force_prana wrote: Thu Feb 22, 2024 5:16 pm]
life_force_prana wrote: Thu Feb 22, 2024 5:16 pm
Thank you for the clarifications.  

I have individual TIPS as part of TIPS ladder in my taxable account. I bought Jan 2034 TIPS at auction recently and need to add to it to complete my ladder for 2034. I am trying to decide if I should buy these additional Jan 2034 TIPS in secondary market or wait till they reopening on 3/21/24 based on tax filing simplicity.  Note I have Jan 2032 and Jan 2033 TIPS ladders complete in my taxable account purchased on secondary market. 

Trying to decide solely based on tax reporting simplicity ignoring real yield (meaning current yield is ok for my purposes as am fine waiting for whatever reopening auction yields).

Given that my Jan 2034 TIPS were bought at auction at slight discount (YTM of 1.81 vs 1.75 coupon), and my Jan 2032 and Jan 2033 TIPS were bought on secondary market at discount, does it make my taxes going forward simpler by buying reopen vs secondary?
[/QUOTE]

I can't think of any reason buying the 2034 at the reopening would make taxes simpler, unless the yield goes down just enough so that it's trading at a de minimis discount or premium to par, and why would you want that? The yields is higher now, at about 1.98%, than the auction yield of 1.81%, so it's trading at a discount--price about 97.92. I would much rather buy at a higher yield and deal with the market discount than buy at a lower yield with no market discount.

The only impact of market discount is that it's reported on 1099-B for the tax year of disposition, and you need to make an adjustment for 1099-B and report it as interest on 1099-INT. It's no more complicated than doing the accrued interest adjustment.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: life_force_prana wrote: Thu Feb 22, 2024 3:08 pmKevin M wrote: Thu Feb 22, 2024 2:47 pmlife_force_prana wrote: Thu Feb 22, 2024 2:09 pm]
life_force_prana wrote: Thu Feb 22, 2024 3:08 pm
Kevin M wrote: Thu Feb 22, 2024 2:47 pm
life_force_prana wrote: Thu Feb 22, 2024 2:09 pm
In 2023 I bought individual TIPS as part of TIPS ladder build out in my taxable account at Fidelity. My consolidated 1099 has:
- $81.49 of OID in box 8 of 1099-OID
- $21.12 of accrued interest paid at purchases made in secondary market for these TIPS in supplemental info

While doing taxes in TT, should I be reporting interest income of $60.37 (81.49-21.12=60.37)?

In 2022, I had a CPA do my taxes. I wanted to learn about TIPS so bought small amount at auction in my taxable account in April 2022 that I sold in December 2022. Fidelity's 1099 showed:
- $1.74 interest income in box 3 of 1099-INT
- $5.93 bond premium in box 12 of 1099-INT
- $97.25 of OID in box 8 of 1099-OID
- $0.10 of accrued interest paid on purchase
- ($168.66) loss on 1099-B

My CPA reported $93 of interest income on Schedule B, and was wondering if they got there by 97.25+1.74-5.93-0.1=92.96, and if that is the right way to back into my CPA's math?  

Also assume loss of $168.66 on TIPS sale got subsumed into Schedule D consolidated net gains/losses?

Thanks a lot. Also if someone can point me to the relevant parts of this thread to read up and learn, please do direct me.

When I import into HRB from Fidelity, I end up with one form for the 1099-INT and one for the 1099-OID; they both are in the interest income interview section. What I would do is enter the accrued interest paid as an adjustment to the 1099-INT.

So you did not receive any Treasury interest income reported on 1099-INT from Fido? If not, I see that HRB lets me enter an accrued interest adjustment in the 1099-OID, so I would enter it there.

Both the interest and the OID end up on Schedule B, and the accrued interest paid to seller ends up there as a negative number. So if you're sharing everything you got from Fidelity, what you show will be what ends up on your Schedule B. But you get it there by entering the numbers into the interview boxes correctly, not by doing the math yourself and circumventing the software.

Got it makes sense.  I do have 1099-INT with interest income - but that is from T-Bills - so I did not mention that to keep the focus of my question on TIPS.  But I am letting tax software do calcs, but wanted to make sure I understand the math.  So I report Tbills interest + TIPS OID - TIPS accrued int paid on Sch B with accr int showing as negative number?
[/QUOTE]

Sounds right. You could enter the accrued interest adjustment in the 1099-OID if you prefer. I don't think it matters as long as everything shows up on Schedule B the way it should.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: life_force_prana wrote: Thu Feb 22, 2024 2:09 pm]
life_force_prana wrote: Thu Feb 22, 2024 2:09 pm
In 2023 I bought individual TIPS as part of TIPS ladder build out in my taxable account at Fidelity. My consolidated 1099 has:
- $81.49 of OID in box 8 of 1099-OID
- $21.12 of accrued interest paid at purchases made in secondary market for these TIPS in supplemental info

While doing taxes in TT, should I be reporting interest income of $60.37 (81.49-21.12=60.37)?

In 2022, I had a CPA do my taxes. I wanted to learn about TIPS so bought small amount at auction in my taxable account in April 2022 that I sold in December 2022. Fidelity's 1099 showed:
- $1.74 interest income in box 3 of 1099-INT
- $5.93 bond premium in box 12 of 1099-INT
- $97.25 of OID in box 8 of 1099-OID
- $0.10 of accrued interest paid on purchase
- ($168.66) loss on 1099-B

My CPA reported $93 of interest income on Schedule B, and was wondering if they got there by 97.25+1.74-5.93-0.1=92.96, and if that is the right way to back into my CPA's math?  

Also assume loss of $168.66 on TIPS sale got subsumed into Schedule D consolidated net gains/losses?

Thanks a lot. Also if someone can point me to the relevant parts of this thread to read up and learn, please do direct me.
[/QUOTE]

When I import into HRB from Fidelity, I end up with one form for the 1099-INT and one for the 1099-OID; they both are in the interest income interview section. What I would do is enter the accrued interest paid as an adjustment to the 1099-INT.

So you did not receive any Treasury interest income reported on 1099-INT from Fido? If not, I see that HRB lets me enter an accrued interest adjustment in the 1099-OID, so I would enter it there.

Both the interest and the OID end up on Schedule B, and the accrued interest paid to seller ends up there as a negative number. So if you're sharing everything you got from Fidelity, what you show will be what ends up on your Schedule B. But you get it there by entering the numbers into the interview boxes correctly, not by doing the math yourself and circumventing the software.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: protagonist wrote: Tue Feb 20, 2024 11:22 am]
protagonist wrote: Tue Feb 20, 2024 11:22 am
Just doing my taxes with HR Block software.

I entered $158 "Bond Premium on Treasury Obligations", as reported in box 12 of my 1099-INT from Fidelity.

That took me to a page in the HR Block software to report my "amortizable bond premium adjustment" from box 12 of my 1099-INT.  There was no clear explanation as to what that included, and no explanatory note in my 2023 Fidelity tax summary.

I entered the full amount of $158.

Is that correct?   

Thanks.
[/QUOTE]

Yes. One caution though. If you paid accrued interest on the purchase, you also need to make an adjustment for that. Since you can only make one adjustment per 1099-INT, you need to use two 1099-INTs; do the ABP adjustment on one, and the accrued interest adjustment on the other. You can split the total amount reported in Box 3 between the two of them in any way you want.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: hudson wrote: Tue Feb 20, 2024 6:07 amDoppler44 wrote: Mon Feb 19, 2024 6:32 pm]
hudson wrote: Tue Feb 20, 2024 6:07 am
Doppler44 wrote: Mon Feb 19, 2024 6:32 pm
The prior discussion on accrued market discount has been quite helpful (thank you!).     I thought I might advance what I have tried using H&R Block tax software. Insofar as I can tell, a number of respondents correctly indicated tax software (H&R and TurboTax) might not "automatically" populate the necessary forms based solely on the 1099-B transaction, even when the data are imported directly from the broker (Schwab and Vanguard for me).

So H&R Block software does treasuries incorrectly?
I just imported Vanguard's tax document and ran it through H&R Block software.  I almost filed it right away, but decided to wait a month.
Should I wait for another update?  Or should I dig into Doppler44's contribution above which will take me a long while.
[/QUOTE]

The discussion here is about market discount. HRB handles it correctly if you follow the instructions. The issue is that although the instructions tell you what needs to be done, they don't tell you exactly how to do it.

So the first question for you is, does your 1099-B include any Treasuries? 

If not, then this particular discussion is not relevant to you (although other discussions in the thread may be, like proper handling of accrued interest paid to the seller).

If so, then the way to handle this has been covered in the thread, and you can find these discussions by searching the thread for "accrued market discount". Doppler44's contribution is nothing new--this has been discussed many times before in the thread, so no need to "dig into" that particular post. But to clarify that HRB "does Treasuries" correctly if you follow the instructions ...

Accrued market discount appears in box 1f of the 1099-B. If you have an entry here, which you will if you disposed of a Treasury note or bond with accrued market discount, and imported the 1099-B from Vanguard, after you click Next on the 1099-B entry screen, a screen will appear asking "What's your market discount adjustment?". Click LEARN MORE to see the instructions. You'll also see "you'll also need to enter it in Interest Income (Form 1099-INT).

For the typical case, you'll enter the value in box 1f of the 1099-B as a negative number in the Market discount adjustment box, then click Next, and you're done with this part. But you need to follow the instruction to enter it in Interest Income (Form 1099-INT).

The way to do that is to manually create a "dummy" 1099-INT in the interest interview section, and enter the accrued market discount in Box 3 of the dummy 1099-INT.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Tue Feb 20, 2024 7:13 amKevin M wrote: Mon Feb 19, 2024 3:46 pmcas wrote: Mon Feb 19, 2024 2:41 pm]
cas wrote: Tue Feb 20, 2024 7:13 am
Kevin M wrote: Mon Feb 19, 2024 3:46 pm
cas wrote: Mon Feb 19, 2024 2:41 pm
(C)De minimis rule
If the market discount is less than ¼ of 1 percent of the stated redemption price of the bond at maturity multiplied by the number of complete years to maturity (after the taxpayer acquired the bond), then the market discount shall be considered to be zero.

[. . .]
I probably won't remember this, and so probably would never apply it, and would always make the adjustment. Apparently if I used TT instead of HRB it would be done correctly.
[. . .]

As far as why the de minimis rule is relevant to the overall purpose of this thread...

My guess is that the context of *market* discount probably isn't the most likely reason that posts will pop up on bogleheads with questions to which the answer is "It's because of the de minimis rule."

My guess is that the more likely context is Treasury notes/bonds bought at *auction*.  All Treasury notes/bonds bought at initial issue auction are issued with a de minimis discount, as a side effect of the coupon rate being set in increments of 0.125%.  (With the exception of the edge case where the auction results in a 0.125% or lower investment rate, causing the treasury to be issued at a premium.)
[/QUOTE]

Agreed.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			^If I'm reading everything you stated correctly, then you did it exactly the way I've done it on 2023 and previous year tax returns.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Mon Feb 19, 2024 2:13 pm]
FactualFran wrote: Mon Feb 19, 2024 2:13 pm
Although the term "de minimis" is not used, a Market Discount section contains the condition when de minimis applies.

Market discount is the amount of the stated redemption price of a bond at maturity that is more than your basis in the bond immediately after you acquire it. You treat market discount as zero if it is less than one-fourth of 1% (0.0025) of the stated redemption price of the bond multiplied by the number of full years to maturity (after you acquire the bond).
[/QUOTE]

[QUOTE: cas wrote: Mon Feb 19, 2024 2:41 pm]
cas wrote: Mon Feb 19, 2024 2:41 pm
Most directly...

26 U.S. Code Subpart B - Market Discount on Bonds  -> 26 U.S. Code § 1278 - Definitions and special rules -> (a)(2)(C) De minimis Rule

(C)De minimis rule
If the market discount is less than ¼ of 1 percent of the stated redemption price of the bond at maturity multiplied by the number of complete years to maturity (after the taxpayer acquired the bond), then the market discount shall be considered to be zero.
[/QUOTE]

Thanks to both of you!

I probably won't remember this, and so probably would never apply it, and would always make the adjustment. Apparently if I used TT instead of HRB it would be done correctly.

One impact of applying the exception would be slightly more income for the state, if they tax capital gains, but I doubt they'd ever audit it.

The other impact could be slightly less tax to the feds if the holding period is more than one year, since LTCG tax rates would apply instead of ordinary income tax rates.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: sgoak wrote: Mon Feb 19, 2024 2:58 pm]
sgoak wrote: Mon Feb 19, 2024 2:58 pm
kevinm wrote: There has been lots of discussion in this thread about the state taxation of accrued market discount for Treasuries. Search the thread for "accrued market discount" and maybe include "state" to see many posts about it. Here's one that seems quite authoritative.
viewtopic.php?p=7342726#p7342726

Thanks for the link, but the post referenced states:
Section 17024. California Revenue and Taxation Code, Section 17024.
But Section 17024 does not say anything about cap gains or market discount. 
as can be seen here:
https://leginfo.legislature.ca.gov/face ... nNum=17024.
It states:   
17024.  The term “Personal Income Tax Law of 1954,” means Part 10 of Division 2 of the Revenue and Taxation Code as enacted by the Statutes 1943, Chapter 659, and as subsequently amended, including all amendments enacted prior to January 1, 1955.
(Added by Stats. 1955, Ch. 939.)

(I suspect that is an AI hallucination as the words ``market discount'' was not  found in the CA Revenue and Tax Code site. 

The Schwab ``Your Guide to Bond Taxes''
https://www.schwab.com/learn/story/your ... bond-taxes
 explicitly lists state taxation for market discount capital gain on Treasuries bonds/notes.  
Is this incorrect or am I reading it wrong?
[/QUOTE]

Yeah, can't trust AI chatbots when it comes to references, so we can discount that part.

Regarding Schwab, I wouldn't take my tax advice from any brokerage website. See the disclaimer in the disclosures section of the web page on which the article appears:

[QUOTE]
The information and content provided herein is general in nature and is for informational purposes only. It is not intended, and should not be construed, as a specific recommendation, individualized tax, legal, or investment advice. Tax laws are subject to change, either prospectively or retroactively. Where specific advice is necessary or appropriate, individuals should contact their own professional tax and investment advisors or other professionals (CPA, Financial Planner, Investment Manager) to help answer questions about specific situations or needs prior to taking any action based upon this information.
[/QUOTE]

Having said that, there's no such thing as "market discount capital gain". Here's what is shown in the applicable table of that article (Market Discount -> Interest Income):

Note the qualifier, "could be" under state taxation for Treasuries. Not definitive, and no references cited. However, they do say in the disclosures:

[QUOTE]
Supporting documentation for any claims or statistical information is available upon request.
[/QUOTE]

Anyone want to request the supporting documentation for the "could be taxable" claim for Treasury accrued market discount?

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kagord wrote: Mon Feb 19, 2024 1:26 pm]
Kagord wrote: Mon Feb 19, 2024 1:26 pm
OK, just confirming, bought 2 treasury notes on the secondary market that matured this year, Schwab auto import to TT, somehow I think it was done right.

Treasury Note A:  $800 accrued market discount gain adj and transferred to Schedule B (de minimis does not apply, $800 was more than .25% face value of note purchase)
Treasury Note B:  $200 accrued market discount left as long term gain  (de minimis applied, $200 was less than .25% face value of note purchase)

Both of these amounts are taxable for state, correct?  Or which states that charge income tax would they not be taxed?
[/QUOTE]

In perusing IRS Pub 550, the de minimis exception is only mentioned with respect to OID, not to market discount. Can you share anything from an IRS pub or the actual revenue code that indicates there is a de minimis exception for market discount?

Since I use HRB, I would have done the accrued market discount for both notes, and I would have entered the amounts as interest in box 3 of the dummy 1099-INT.

There has been lots of discussion in this thread about the state taxation of accrued market discount for Treasuries. Search the thread for "accrued market discount" and maybe include "state" to see many posts about it. Here's one that seems quite authoritative.

The upshot is that accrued market discount is treated as US Treasury interest for purposes of state income taxes with the possible exception of one or two states, and those exceptions are questionable in terms of adhering to federal tax statutes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: sgoak wrote: Mon Feb 19, 2024 12:52 pm]
sgoak wrote: Mon Feb 19, 2024 12:52 pm
sherwood88 wrote:
Hi - How do you trick TurboTax to tell that accrued market discount is from a US Govt. I have everything working except want to make sure I get state exemption from this income. If there is check mark, please provide instruction or pic where to input. thank you!

My understanding is that the ``accrued market discount'' is treated as a capital gain, and hence is taxable at the state level.
[/QUOTE]

Nope, accrued market discount is not treated as capital gain. See the OP. An adjustment is entered to deduct accrued market discount from cap gain, and the same amount is entered on Schedule B as interest. So the only question is, "what type of interest?"

With HRB, you must use a dummy 1099-INT to get the interest onto Schedule B. I enter the amount in box 3 of the dummy 1099-INT, so it's treated as Treasury interest, and deducted from state income.

I don't recall how you do this in TT, if anyone has shared that yet.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Pam01 wrote: Sun Feb 18, 2024 4:00 pmKevin M wrote: Fri Feb 16, 2024 3:19 pm]
Pam01 wrote: Sun Feb 18, 2024 4:00 pm
Kevin M wrote: Fri Feb 16, 2024 3:19 pm
I don't believe accrued interest you paid the buyer is reported in 1099-INT; I know it's not for accrued interest you receive from the seller. You must enter an adjustment for accrued interest. I think whatever interest is on box 3 of 1099-INT is from other Treasuries, unless you actually did receive a coupon payment for this Treasury in 2023.

For the 1099-INT, I can only speak about HRB, because that's what I use. You can only enter one adjustment per 1099-INT. For the accrued interest adjustment, you check the "bought or sold between interest payments". Since you both bought and sold the bond between interest payments, you'll need to use two 1099-INTs to enter the adjustments, one for the accrued interest paid to the seller, and the other for the acc int received from the buyer.

I probably would enter some of the box 3 interest in one 1099-INT and the rest in the other. All that matters is that the correct amount of interest and accrued interest adjustments end up on Schedule B.

Thank you, Kevin. You are correct that accrued interest I paid to the buyer is not reported on 1099-INT line 3. Box 3 interest on the 1099-INT from Vanguard is for other treasuries PLUS the accrued interest I received when I sold these market discount bonds. Vanguard helpfully included the accrued interest I paid the buyer in the supplemental information that came with 1099-INT. So I just had to make one adjustment for this 1099-INT in order to reduce  the amount of accrued interest reported on box 3 with the amount I paid when I bought the bond.
[/QUOTE]

Sorry, my brain wasn't working well when I replied, so my reply is all wrong. Let's start over with the purchase, since I've dealt with that on this year's tax return.

When you buy a note or bond with accrued interest, the amount you pay (the seller) includes the accrued interest. You get that back with your first coupon payment, assuming you hold the bond until that coupon payment. This interest payment (all of it) is included in the amount in box 3 of 1099-INT. Since you didn't really earn all of that interest, you deduct the accrued interest you paid the seller as an adjustment. That adjustment is included in the ACCRUED INTEREST amount reported on Schedule B as a negative number. Line 2 of Schedule B shows the total of amounts on line 1, so it's the interest income minus the accrued interest.

On my Schedule B, the first row is "See attached worksheet(s) for detail.", and the total interest income is in the amount column. There also is a SUBTOTAL line with an amount that's the same as the first row amount. Then there's an ACCRUED INTEREST row with the total accrued interest amount which is the total of all 1099-INT accrued interest adjustments, entered as a negative number.

The Schedule B worksheet (INTEREST INCOME SUMMARY) shows the interest income and accrued interest adjustments for all 1099-INT forms. There are totals for gross interest, taxable interest, US Treasury interest and tax-exempt interest, as well as for accrued interest. In my case, the Gross interest and accrued interest totals are what appear on Schedule B (no tax-exempt interest on 1099-INTs this year).

I sold some Treasury notes before maturity in 2019 at Schwab. Looking at my 1099-INT, I see that Schwab did report the accrued interest from sale of Treasury obligations in a subsection of the interest income details section, along with the coupon interest in another subsection. Both subsections indicate that the amounts are included in Box 3.

So if you received no coupon payment from these Treasuries, you would have received from the buyer both the accrued interest you paid the seller and the accrued interest you earned. You would then enter the adjustment for the accrued interest you paid the seller, which is what you did, so as far as I can tell, what you did is correct.

[QUOTE: Pam01 wrote: Sun Feb 18, 2024 4:00 pm]
Pam01 wrote: Sun Feb 18, 2024 4:00 pm
I too am using HRB. Regarding reporting market discount, I entered the market discount total amount from 1099-B on a dummy 1099-INT with the title "Accrued market discount". When I did that, HRB moved all the itemized interests from Part 1 of Schedule B line 1 to an "Interest Income Summary" supplemental form and just reported total of these in Schedule B part 1 line 1, added a line for "Accrued interest" and reported the difference between these as the final total to be reported on line 2. Was that the behavior you saw when you created a dummy 1099-INT to report market discount?
[/QUOTE]

Yes. I assume you also entered the accrued market discount as an adjustment when entering the 1099-B, and that you entered it as a negative amount on the market discount adjustment screen.

As an aside, I had entered the market discount adjustment as a positive number for one of my 1099-Bs on my first pass, but corrected that in one of the many reviews I'll do. The note to "(enter as a negative amount)" is in really small type to the right of the box where you enter the adjustment amount. So easy to make a mistake like this if you're not really careful. After all, you enter the accrued interest paid adjustment as a postive number, even though it is subtracted from your interest income on Schedule B.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: DetroitRick wrote: Sun Feb 18, 2024 1:34 pm]
DetroitRick wrote: Sun Feb 18, 2024 1:34 pm
I see only 1 alternative (for me, using TurboTax and in a state that doesn't tax Accrued Market Discount):  manually override the subtraction field on my state return.  Which (I've heard, and am currently trying to confirm) might mean I have to do a paper state filing.
[/QUOTE]

So there are no other lines in the TT state income tax worksheets where you can enter additional subtractions? Some else mentioned that this was the case for their state.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Pam01 wrote: Fri Feb 16, 2024 2:30 pm]
Pam01 wrote: Fri Feb 16, 2024 2:30 pm
I had the unusual situation of buying and selling a bond in secondary market the SAME year (2023). I paid accrued interest at the time of purchase. And received accrued interest at the time of sale. However, the actual coupon payment is not until 2024 to the new buyer of the bond I sold. 

Now, since I disposed of the bond in 2023 and received accrued interest during the sale, it is correctly included in box 3 of 1099-INT I received from my brokerage. The supplement information of 1099-INT that was not reported to IRS also includes the accrued interest I paid at the time of purchase. I am reporting Box 3 interest in Form 1099-B. Additionally, since I already received the interest at the time of sale, depite coupon payment not happening until 2024, I think I must deduct accrued interest at the time of purchase in 1099-B. Is my understanding correct?
[/QUOTE]

The 1099-B includes capital gain/loss and accrued market discount (box f). For the interest, it's all handled with 1099-INTs. 

The 1099-B would include accrued market discount, if any, for which you enter an adjustment for the 1099-B. With TurboTax, that's all you do, except for dealing with the state income tax deduction. With HRB, you must manually enter a dummy 1099-INT to report the interest on Schedule B.

I don't believe accrued interest you paid the buyer is reported in 1099-INT; I know it's not for accrued interest you receive from the seller. You must enter an adjustment for accrued interest. I think whatever interest is in box 3 of 1099-INT is from other Treasuries, unless you actually did receive a coupon payment for this Treasury in 2023.

For the 1099-INT, I can only speak about HRB, because that's what I use. You can only enter one adjustment per 1099-INT. For the accrued interest adjustment, you check the "bought or sold between interest payments". Since you both bought and sold the bond between interest payments, you'll need to use two 1099-INTs to enter the adjustments, one for the accrued interest paid to the seller, and the other for the acc int received from the buyer.

I probably would enter some of the box 3 interest in one 1099-INT and the rest in the other. All that matters is that the correct amount of interest and accrued interest adjustments end up on Schedule B.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: 1099-INT,  Fidelity, Treasury accrued interest, HRBlock
			
[QUOTE: Artsdoctor wrote: Thu Feb 15, 2024 4:47 pm]
Artsdoctor wrote: Thu Feb 15, 2024 4:47 pm
Although the HRBlock instructions will undoubtedly be helpful to many, the bigger message might be that if someone as savvy as you can forget about unused accrued interest from one year to the next, it can happen to anyone.
[/QUOTE]

I would have caught it at some point. That's why I document it in my tax spreadsheet. I'm going to run across it at some point when entering updates into the tax spreadsheet. But yeah, I highlighted it to emphasize not to forget about it.

[QUOTE: Artsdoctor wrote: Thu Feb 15, 2024 4:47 pm]
Artsdoctor wrote: Thu Feb 15, 2024 4:47 pmAnother issue I'm starting to see trickle into other threads is the desire to take that accrued interest from a treasury note which can't be used for treasury interest in the year of purchase, and use it for other interest-bearing investments (like CDs).  I would not have thought this could be confusing but evidently it is.
[/QUOTE]

I'd say that's a no-no. Treasury interest is not taxable by the state, but anything reported in box 1 of the 1099-INT is. Using Treasury accrued interest to reduce box 1 interest reduces your state income when it shouldn't.

I just dealt with this. My Schwab 1099-INT had interest in box 1, which was mostly the bonus I got for moving the account there, as well as my T interest in box 3. I deleted the box 1 interest from this 1099-INT, did the Treasury accrued interest adjustment, and created a dummy 1099-INT to report the box 1 interest with no adjustments. If you don't do this, I believe HRB allocates the accrued interest adjustment between box 1 and box 3.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: phoroner wrote: Thu Feb 15, 2024 10:52 pm]
phoroner wrote: Thu Feb 15, 2024 10:52 pm
Just got my 1099 from Vanguard today for a taxable brokerage account

For treasury note bought at a discount and held to maturity, the cost basis was appropriately adjusted. But there is no reporting of the market discount on the 1099-INT form. This seems like an error; has anyone else had this happen?

Thanks
[/QUOTE]

Read about Accrued market discount in the OP.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: IDpilot wrote: Fri Feb 16, 2024 9:05 amRichard1580 wrote: Thu Feb 15, 2024 6:25 pm]
IDpilot wrote: Fri Feb 16, 2024 9:05 am
Richard1580 wrote: Thu Feb 15, 2024 6:25 pm
Reading through this thread I am amused that no one has asked the fundamental question - why is our tax code this convoluted (i.e. f'ed up.)?

I think we all know the reasons.  I just find it amusing that no one addresses the gorilla in the room, but just takes its presence as an inconvenient given.  Weird.

That's because LadyGeek will pounce on you like an enraged Griffon!
[/QUOTE]

Exactly. We're not supposed to discuss stuff like that. Also this thread is action oriented--i.e., it's intended to help folks with tax reporting for Treasuries, and discussing topics like "why tax code is convoluted" doesn't help with that.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

1099-INT,  Fidelity, Treasury accrued interest, HRBlock
			EDIT. In working on something else, I ran across the accrued interest paid in 2022 in my tax spreadsheet that I was not able to deduct on my 2022 return, which I had forgotten about. I modified the steps below to include it.

Just entered my Fidelity interest, all of which was Treasury interest (USGO), into HRB 1099-INT. Some of the Treasuries I bought in 2023 were notes or bonds on which I paid accrued interest. Per the edit note above, I had purchased Treasuries in 2022, and paid accrued interest that I was not able to deduct on my 2022 return. I had noted this amount in my income tax spreadsheet. Below are the steps I followed to enter this all into the 1099-INT form in the HRBlock tax software.

Downloaded the Fidelity 1099-consolidated tax doc for this account.
Scrolled to the end of the 1099-Consolidated to find Accrued Interest Paid on Purchases in the 2023 SUPPLEMENTAL INFORMATION section. Entered the total accrued interest paid in 2023 into my tax spreadsheet, on the row below the the accrued interest paid in 2022 that I was not able to deduct for 2022. No, I did not check to verify that I received a coupon for every bond listed in the 1099 accrued interest section. 
In the spreadsheet row below, calculated the sum of the accrued interest paid in 2022 and 2023.
In the interest income interview section of HRB, imported tax forms from Fidelity, which included the 1099-INT.
Opened the 1099-INT from NATIONAL FINANCIAL SERVICES LLC (deleted the empty one from last year), and verified that the amount in Box 3, which was all there was, matched the 1099-INT box 3 amount in the 1099-Consolidated tax doc provided by Fido.
At the bottom of the HRB 1099-INT form, checked the box next to Interest item requires an adjustment (uncommon) LEARN MORE, then clicked Next.
Clicked the radio button for Bought or sold this bond between interest payments.
Entered the total amount of accrued interest calculated in step #3 above (as a positive number).  Clicked Next.
Opened the Schedule B form, and verified that ACCRUED INTEREST is entered as a negative number on the form.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: parval wrote: Tue Feb 13, 2024 3:07 pm]
parval wrote: Tue Feb 13, 2024 3:07 pm
Sorry if this has been covered, I did search but couldn't find anything:

Is anyone trading on Interactive Brokers (IBKR) and is that handled automatically by TurboTax import?

Specifically I bought US-T GOVT Bills May23'24

If I'm in a high tax state, do I need to do anything when I report on TT next year?
[/QUOTE]

Although not specific to IBKR, the general taxation is indeed covered in the OP:

[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Treasury bills are the easiest to understand. Say you pay $990 for $1,000 of face value (this is the minimum at a broker). At maturity you'll receive $1,000; $10 of this will be reported as interest in box 3 of 1099-INT for the year of maturity. IRS publications refer to this $10 as accrued acquisition discount. 

Treasury bill interest (accrued acquisition discount) is exempt from state and local income tax, as is anything reported in box 3 of 1099-INT. All of this is true whether you buy at auction or on the secondary market.
[/QUOTE]

So the 1099-INT you receive from IBKR should comply with this. TT automatically excludes USGO reported in box 3 of 1099-INT from state income taxes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: AQ wrote: Mon Feb 12, 2024 5:06 pm]
AQ wrote: Mon Feb 12, 2024 5:06 pm
A data point about entering Accrued Market Discount for State tax filing. I'm using TurboTax 2023 Home&Business. 

I bought 2 Treasury bonds on secondary market and held to maturity. Fidelity 1099B reports the difference between purchase price & par as AMD. 

TT offers two ways to enter 1099B. The 'summary' approach won't work for AMD. So I entered the numbers for trades one by one. There is a button you could select to enter AMD to box 1F. Then TT will report capital gain = 0 on form 8949, and AMD as interest income on Schedule B. So no dummy 1099-INT needed. 

However, the State tax part doesn't treat this AMD as government obligations and charge me state tax (I'm a CA resident). 

When I played State Tax part, there is a radio 'Interest/Divdend adjustment' under heading 'Investment'. But none seem fitting what I needed to do. After hitting 'continue' there is a catch-all screen 'other adjustment' where we can make 'subtraction' or 'addition' to Interest. I entered AMD there and bingo, my state tax reduced respectively. 

Not sure if this is the proper way but it's one way to get the tax amount right.

p.s. I always hesitate to manually work on FORM mode and prefer to get things done with 'step-by-step'. Whenever I manually edit a tax form, TT always asks me to mail materials to IRS and sometimes not let me do e-filing..
[/QUOTE]

Based on other posts we've seen, this seems to be the way to do it with TT. In a way, it's easier with HRB, since when I enter the dummy 1099-INT, and can put the ACM in box three, and it is automatically excluded from state income. Entering a dummy 1099-INT is super easy.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: TetrisCollider wrote: Mon Feb 12, 2024 10:18 am]
TetrisCollider wrote: Mon Feb 12, 2024 10:18 am
See this thread as well - TurboTax 2023 Accrued Market Discount Info lower in the thread.
[/QUOTE]

That thread is a bit of a mess. The original post in that thread is about T bills; there is no accrued market discount for Tbills--there is accrued acquisition discount, and bills are handled completely differently than notes or bonds (see the OP of this thread). 

Then the thread veers off topic into accrued market discount, and in that discussion there are several links back to this thread, including one that details handling AMD in Turbo Tax. TetrisCollider did post something that could help TT users avoid some confusion; I'll repost it here so we have that info in this thread too:

[QUOTE: TetrisCollider wrote: Sun Feb 11, 2024 3:27 pmcas wrote: Sun Feb 11, 2024 1:56 pmTetrisCollider wrote: Sun Feb 11, 2024 1:49 pm]
TetrisCollider wrote: Sun Feb 11, 2024 3:27 pm
cas wrote: Sun Feb 11, 2024 1:56 pm
TetrisCollider wrote: Sun Feb 11, 2024 1:49 pm
I am using TurboTax Premier 2023 (Desktop version) and when I enter this 1099-B using Step-by-Step, there are no options provided to identify Accrued Market Discount entries - only Short/Term Capital Gains/Losses.  If I switch to Forms, neither on Schedule B or Form 8949, this is not entered as Accrued Market Discount, but as Short Term Capital Gain.  So it seems I have to force this entry (Accrued Market Discount) manually using the Forms section, as Step-by-Step does not provide such an option.

Either I am doing something wrong (using the Step-by-Step) or TurboTax did not include this option in the flow or missed it completely (as they have been known to do on multiple occasions).

Here's a post in the Taxation of Treasury bills, notes and bonds megathread where I did a test of how Turbotax handled accrued market discount on a Treasury note/bond:  viewtopic.php?p=6966716#p6966716

(Test done in late 2022 with Turbotax 2021, so not the current Turbotax release.  I haven't looked to see if Turbotax is still the same for 2023.   But in 2022 Turbotax definitely provided a way to handle accrued market discount at the federal level.)

Cas, thank you very much for this.  In a way, this actually helped.  Here are the details:

Something just was not looking right in TurboTax 2023, so after reading your reply, I went to my TurboTax 2022 and essentially simulated entering my 2023 entry using 2022 version.  Lo and Behold, there was an available box for "My 1099-B has additional boxes checked" and once clicked, gave me an Accrued Market Discount 1(f) box.  And after I entered the info, I went directly into Form 8949, which was filled out correctly.

So, now that I knew exactly what to look for in 8949 form, I started playing with TT 2023.  First and foremost, the Step-by-Step screens in TT 2023 for 1099-B entries look completely different from 2022 version. When I was entering my 1099-B initially in TT 2023, I picked to enter it as a REPORTED SUMMARY.  The only thing that option provided for variations is to check a box named "I need to adjust my cost basis".  When this was box was checked, Accrued Market Discount box did show up, but when numbers were entered, the Total Gain was essentially doubled and on top of that, the next screen said that "You will need to mail in your tax return to IRS". BTW, 8949 form in TT 2023 looks quite a bit different from version 2022 and not for the better.  

Obviously this was completely wrong and then I tried to enter (again, using TT 2023) 1099-B as Individual entries.  Using this option now did give me the same options as in 2022 version, where I was able to enter Box 1(f) entry.  Interestingly, the description of the box was "Accrued Interest Included in Proceeds (Market Discount)".  Once the numbers were entered, the total Capital Gains were correctly adjusted to Zero, but when I looked in form 8949, there was NO ENTRY at all of this line - it was only shown on Schedule B.  

Bottom Line at this time - it seems that TurboTax Premier 2023 version is either screwed up with regards to Accrued Market Discount and hopefully will get updated by Intuit soon, or this will not get corrected and the only way to correctly enter things is to manually force it in all the needed forms (which I have done in at least one past version).

Hope this helps others when they encounter this.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: AQ wrote: Sun Feb 11, 2024 7:03 pmKevin M wrote: Wed Nov 16, 2022 12:07 pm]
AQ wrote: Sun Feb 11, 2024 7:03 pm
Kevin M wrote: Wed Nov 16, 2022 12:07 pm

The way I've done this with tax software is to create a dummy 1099-INT and enter the interest in it. You would enter it into either box 1 or box 3 of the dummy 1099-INT, depending on whether or not the accrued interest is exempt from state and local income tax. As I recall, I entered it in box 3. I am a CA resident.

Kevin

@Kevin, is the following what your approach is as described in quoted comments above? 

Let's say as an example I bought a Treasury bond with $950. At maturity it's redeemed at $1,000. The 1099-B would report 1F (i.e. AMD) $50. 

If I understand you correctly, for tax software, you either enter a 1099-B with an adjusted basis $1,000, so no capital gain/loss. Or simply ignore this trade on 1099-B altogether. (which way did you choose?)

Then create a 'dummy' 1099-INT, place $50 on Box 3, and then enter a 1099-INT on the software. 

This way, AMD of $50 would not be treated as a capital gain/loss, but show up on Schedule B. (how should I put the payer's name, US treasury?)

It's clear that we've paid our tax due with this approach, but does a dummy 1099-INT raise a red flag from IRS or state tax authority since it's not a real form issued by anyone? Or as long as we pay our due there is nothing to worry about? 

Many thanks!
[/QUOTE]

If you search this thread for "accrued market discount" you'll see the discussions about it. Here's one of the replies that comes up in the search results that I think covers it fairly well.

Summary:

You do enter the 1099-B. 
You enter the basis shown on the 1099-B. 
You enter the lesser of accrued market discount or capital gain as an adjustment. 
With HRBlock, you enter a dummy 1099-INT to report the adjustment amount as interest. For Treasuries, I enter it in box 3 so it's deducted from state income tax.
TurboTax users have reported that a dummy 1099-INT is not required, since TT reports the interest for you on Schedule B. However, I don't recall seeing a report of how to get TT to subtract the ACM as US government interest on the state tax return.

With HRB, the dummy 1099-INT is just a way to get the interest onto Schedule B, which I think is all the tax authorities care about. I've used dummy 1099-INT forms for various purposes, and it's never been an issue.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: stevew7 wrote: Tue Jan 30, 2024 4:34 pm]
stevew7 wrote: Tue Jan 30, 2024 4:34 pm
After reading about the complexities of dealing with accrued interest and accrued market discounts on my tax return, I thought skipping the secondary market and buying US treasury bonds at auction would bypass all the complexity.  

Unfortunately I missed that some of the 20 year bonds I purchased in Oct 2023 (CUSIP 912810TU2) were during an auction that sold "re-opened" bonds (and I did not receive any coupon payments in 2023), so my Vanguard 1099-INT has a non zero value for a line item:

The following amounts are not reported to the IRS. They are presented here for your reference when preparing your tax return(s).

Taxable accrued Treasury interest paid 

And in the 1099 "detail" section, there is a negative number with the transaction type listed as "Treasury accrued interest pd" but this negative number matches the "taxable accrued treasury interest paid" earlier in the 1099-int.

So based on this other thread and from what I could pick through on this thread (viewtopic.php?t=271391), is it correct to say I do NOTHING with the taxable accrued treasury interest paid this tax year, but next year in 2024 when I receive my first interest payment from this treasury bond, I would SUBTRACT out the "accrued treasury interest paid" that showed up on this year's 2023 1099-DIV on my 2024 return?
[/QUOTE]

This has been discussed a lot in this thread, but I know it's hard to find things.

If I have more interest reported on the 1099-INT than the accrued interest paid, I subtract the accrued interest paid for the tax year in which it was paid, regardless of whether or not I received a coupon for that particular bond. If I don't, I make a note of it in my income tax spreadsheet, and deduct it the following tax year.

I will buy you a beer if you do what I do and ever have it challenged in an IRS audit.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			The exact details of how you enter the USGO portion of a fund's income for a 1099-DIV depends on your tax software. I posted a short answer about how to do it with HR Block tax software earlier in the thread in this post. I found it by searching this thread for "HR Block".

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Merry wrote: Tue Jan 02, 2024 2:32 pm]
Merry wrote: Tue Jan 02, 2024 2:32 pm
Didn’t catch this discussion above, sorry if it’s a duplicate. Given how secondary CD interest and secondary T-note coupons are both shown as 1099-INT, is it fair to say that if someone is holding either to maturity over 1 year and is filing in a 0% long-term capital gains bracket, it would be better for taxes owed to pick a low coupon T-note than a high note T-note and also better to pick a low coupon T-note than a CD? That way the 1099-INT is lower and the maturity accrued market discount payment won’t be taxed? 

I’m thinking of selling our $63k 4.9% CD that matures in 2 years and buying a 4.35% 2 year Tnote with a 0.375% coupon. Fidelity’s calculator shows the T-note should yield 4.6% in consideration of state taxes saved but I’m thinking the last 0.25% yield difference will more than be saved because of the CD interest vs T-note coupon difference (and because the accrued market discount won’t be taxed). Am I understanding this correctly and making a good decision?
[/QUOTE]

Your LTCG rate has nothing to do with it. It's true that the accrued market discount is taxed upon disposition by default, but it's taxed as interest, not capital gains. So you can defer the tax, but you will pay it eventually.

Also, the bid/ask spread on a brokered CD can be quite high. If it's a direct CD, there's an early withdrawal penalty.

I would not do it.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Tue Dec 26, 2023 3:04 pmKevin M wrote: Tue Dec 26, 2023 2:58 pmJaylat wrote: Tue Dec 26, 2023 2:47 pmexodusing wrote: Tue Dec 26, 2023 2:07 pmJaylat wrote: Tue Dec 26, 2023 2:00 pm]
Jaylat wrote: Tue Dec 26, 2023 3:04 pm
Kevin M wrote: Tue Dec 26, 2023 2:58 pm
Jaylat wrote: Tue Dec 26, 2023 2:47 pm
exodusing wrote: Tue Dec 26, 2023 2:07 pm
Jaylat wrote: Tue Dec 26, 2023 2:00 pm
For those of you with TIPS in taxable accounts, to my understanding you are required to make estimated tax payments before January 16, but Form 1099-OID will not be ready until February. 

How are you handling this?

You could (1) pay the safe harbor, usually 100% of prior year's taxes, or (2) calculate.

Thanks, but I have a lot more TIPS than last year. Not sure if the safe harbor would work? I've already calculated the amount, but was curious how others addressed this. I doubt many people would be able to calculate it?

Why would safe harbor not work?

If you pay 100% or 110% of tax shown on the return for the prior year, depending on AGI. That's what I always do, unless I expect my taxable income to be much lower than the prior year. I did it for a tax year in which I had a lot more taxable income than the year before, and it was no problem.

You might be right, but I estimate roughly 4x as much OID income as last year. Seems like a big difference.
[/QUOTE]

Doesn't matter as long as you use the safe harbor based on prior year tax return, and can come up with the cash to pay the tax.

In normal years, I just have an amount equal to my last year's tax withheld from the RMD from my inherited IRA.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Jaylat wrote: Tue Dec 26, 2023 2:47 pmexodusing wrote: Tue Dec 26, 2023 2:07 pmJaylat wrote: Tue Dec 26, 2023 2:00 pm]
Jaylat wrote: Tue Dec 26, 2023 2:47 pm
exodusing wrote: Tue Dec 26, 2023 2:07 pm
Jaylat wrote: Tue Dec 26, 2023 2:00 pm
For those of you with TIPS in taxable accounts, to my understanding you are required to make estimated tax payments before January 16, but Form 1099-OID will not be ready until February. 

How are you handling this?

You could (1) pay the safe harbor, usually 100% of prior year's taxes, or (2) calculate.

Thanks, but I have a lot more TIPS than last year. Not sure if the safe harbor would work? I've already calculated the amount, but was curious how others addressed this. I doubt many people would be able to calculate it?
[/QUOTE]

Why would safe harbor not work?

If you pay 100% or 110% of tax shown on the return for the prior year, depending on AGI. That's what I always do, unless I expect my taxable income to be much lower than the prior year. I did it for a tax year in which I had a lot more taxable income than the year before, and it was no problem.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: jeffyscott wrote: Fri Dec 22, 2023 8:07 amKevin M wrote: Tue Dec 19, 2023 4:50 pmWhitePuma wrote: Tue Dec 19, 2023 3:16 pm]
jeffyscott wrote: Fri Dec 22, 2023 8:07 am
Kevin M wrote: Tue Dec 19, 2023 4:50 pm
WhitePuma wrote: Tue Dec 19, 2023 3:16 pm
I’m confused on notes. Does the topic of discount/premium only apply to purchases made on the secondary market, or does it also apply to purchases at auction?

How does one know if they are purchasing at discount or premium on the secondary market?

Is the delta (par - price paid) considered a capital gain that could receive preferential LTCG rates?

Why wouldn’t the capital gain (or interest) be considered exempt from SALT? How does one determine this?

Notes sold at auction have "de minimis" discount or premium, meaning that it's small enough that you don't report it on your income tax returns. This leads to answering your second question.

If you buy on the secondary market and hold to maturity, with the purchase being in the same calendar year as the bond/note/bill matures, do you also avoid any amortization complications?
[/QUOTE]

Not that I can think of. The reporting of accrued market or acquisition discount or of bond premium amortization is the same regardless.

[QUOTE: jeffyscott wrote: Fri Dec 22, 2023 8:07 am]
jeffyscott wrote: Fri Dec 22, 2023 8:07 amAlso, I just noticed there is a setting for "Fixed income amortization" on Schwab. It says: Per IRS requirements, Schwab defaults to the "On" setting for amortizing and accreting the cost basis on your fixed income positions.
and
If you are considering changes to these default settings, please Contact Us to obtain the Letter of Authorization (LOA) to Change Fixed Income Amortization & Accretion Settings form.

Would using an alternative to the default (assuming it's allowed) generally make taxes simpler or more complex?
[/QUOTE]

I'm assuming that this default means that accrued market discount is reported on the 1099-B at disposition, which I think is the case based on my experience with Schwab 1099s, and I think this generally is the case for brokers.

I think reporting accrued market discount as income annually would be more complicated, as you'd have to deal with it on your tax return every year, instead of just in the year of disposition. Also, generally deferring taxes seems to be desirable for most people. I think I'd only do this if I wanted to pull income into earlier years.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Tue Dec 19, 2023 7:17 pm]
SlowMovingInvestor wrote: Tue Dec 19, 2023 7:17 pm
Thanks for the response, Kevin. 

I was confused by Fidelity's year to date activity entries for notes I held to maturity. So, if I understand you correctly, it seems the items Fidelity shows for tax activity YTD as 'short term gain/long term gain' will have their basis adjusted up by the market accrued discount income when the 1099-B is actually generated, so wouldn't produce any taxable gains for me in 1099-B? Or maybe my tax software will have to do the adjustment to basis, but in any case, there are no generated taxable gains that I can use to offset losses. 

My apologies if I'm being thick headed on this
[/QUOTE]

Yeah, we've had a number of folks confused by how brokerage websites show tax stuff. I never even look at it.

Technically, the basis doesn't get "adjusted up", which is how I remembered it before being corrected by erp, but roughly you can think of it that way. I'm pretty sure I posted this already, but here it is again, with somewhat different wording: The 1099-B shows these numbers:

proceeds

cost/basis

accrued market discount

The accrued market discount adjustment is the smaller of proceeds minus cost and AMD, and this is entered as a negative number to adjust the cap gain. If you hold to maturity, proceeds - cost = AMD, so your CG = 0. Whether or not you hold to maturity, the AMD is entered on Schedule B as interest.

Apparently if you use TurboTax, and just enter these numbers into the 1099-B form, it does everything correctly. With HRB, we have to enter a dummy 1099-INT to put get the AMD onto Schedule B as interest. If we enter it in box 3 in the dummy 1099-INT, it gets subtracted from income for state income tax purposes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: WhitePuma wrote: Tue Dec 19, 2023 3:16 pm]
WhitePuma wrote: Tue Dec 19, 2023 3:16 pm
I’m confused on notes. Does the topic of discount/premium only apply to purchases made on the secondary market, or does it also apply to purchases at auction?

How does one know if they are purchasing at discount or premium on the secondary market?

Is the delta (par - price paid) considered a capital gain that could receive preferential LTCG rates?

Why wouldn’t the capital gain (or interest) be considered exempt from SALT? How does one determine this?
[/QUOTE]

Notes sold at auction have "de minimis" discount or premium, meaning that it's small enough that you don't report it on your income tax returns. This leads to answering your second question.

Bonds are priced as a percent of face value, so a price of 99 is 99% of face value. Bonds are sold by brokers in increments of $1,000 face value, so one bond priced at 99 is valued at $990. A bond priced at 101 is valued at $1,010. If you pay less than 100, you are buying at a discount, and more than 100 at a premium. A bond priced at 100 is known as a par bond, so bonds bought at less than par are discount bonds, and more than par are premium bonds.

Here are prices of notes at the last 10 auctions:

99.680564

101.626935

99.856744

99.977397

99.800095

99.940709

99.848482

99.789641

99.806484

100.000000

You can see that these are all very close to 100, so de minimis, and so no market discount or premium to report. This pricing is a feature of the way prices and yields are determined at auction. The yield for new issues is equal to or a little more than the coupon (rate), and the price is equal to or a little less than 100.

The default is to accrue market discount linearly, and pay the tax on the accrued market discount at disposition, but if you're only interested in auction purchases, you can ignore this, as we've discussed. So if you buy a bond on the secondary market for $900 with 100 days to maturity, you accrue $1/day. If you sell the bond after 50 days for $960, there is $50 of accrued interest and $10 of STCG. If you sell at $940 after 50 days, you have a STCG of $0, and accrued market discount of $40, as we are reminded repeatedly by erp.    These are not realistic numbers given today's yields--I just picked them to make the example super simple.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: erp wrote: Tue Dec 19, 2023 3:13 pmKevin M wrote: Tue Dec 19, 2023 12:16 pm]
erp wrote: Tue Dec 19, 2023 3:13 pm
Kevin M wrote: Tue Dec 19, 2023 12:16 pm
Nope. Accrued  market discount is taxed as ordinary interest income. If you hold to maturity, there will be no capital gain or loss. If you sell before maturity, the difference between the accrued market discount and the profit will be capital gain or loss. See the first post in this thread.

Now what did we just talk about?
[/QUOTE]

  

[QUOTE: erp wrote: Tue Dec 19, 2023 3:13 pm]
erp wrote: Tue Dec 19, 2023 3:13 pmbtw I tested this in TurboTax and it does the right thing.  If the realized gain is greater than the accrued market discount, then it adds an entry to Schedule B for the accrued market discount and adjusts the sale on the 8949 to show just the cap gain above that.

If the realized gain is less than the accrued market discount, then it caps the gain and shows it on Schedule B and a $0 net gain on 8949.

So no dummy 1099int entry required as compared to H&RBlock, however, it didn't deduct the income on the state return (someone said in this thread that in my state accrued market discount is not taxable by the state), so I have to remember to find the question during the state interview to offset it.  I guess for H&RBlock, since you are creating the dummy 1099int, you can just put the interest in box 3 and it'll work automatically.
[/QUOTE]

Yeah, you're verifying what I recall someone else posting about TT. And yep, the dummy 1099-INT with interest in box 3 handles the state tax exemption.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Mon Dec 18, 2023 4:59 pm]
SlowMovingInvestor wrote: Mon Dec 18, 2023 4:59 pm
I was looking at my year-to-date tax info at Fidelity. It shows a few Treasury notes that I bought around the middle of last year being redeemed this year with gains (short and long term).

Fidelity classifies this as realized market discount income and says 'Fidelity's calculation of realized market discount income assumes you elected to defer recognizing the market discount until the sale (or other disposition) of the security, and assumes you elected to use the constant yield method from acquisition date through disposition date'

So I should assume that these gains will show up on my 1099-B as gains (short term or long term), with the obvious caveat that this could change when Fido generates the official forms if some corrections take place?

The reason I'm asking is that I have some capital tax losses that I do not want to carry over. So, I want to confirm these Treasury gains will be reported as capital gains, which will allow me to determine how much extra gain harvesting I need to do.
[/QUOTE]

Nope. Accrued  market discount is taxed as ordinary interest income. If you hold to maturity, there will be no capital gain or loss. If you sell before maturity, the difference between the accrued market discount and the profit will be capital gain or loss. See the first post in this thread.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Artsdoctor wrote: Sun Dec 17, 2023 1:36 pm]
Artsdoctor wrote: Sun Dec 17, 2023 1:36 pm
^  Just a small sticking point, though.  Interest and short-term capital gains may NOT necessarily be taxed the same at the end of the day for some.  Many of us have carryover losses from years gone by so there would be no effective tax on the short-term capital gain (if there is one).
[/QUOTE]

Of course. I addressed that:

[QUOTE: Kevin M wrote: Sat Dec 16, 2023 8:38 pm]
Kevin M wrote: Sat Dec 16, 2023 8:38 pm
But as you point out, it could make a difference to the extent there is a net difference on either the fed or state return due to differences in the way they are handled.
[/QUOTE]

[QUOTE: Artsdoctor wrote: Sun Dec 17, 2023 1:36 pm]
Artsdoctor wrote: Sun Dec 17, 2023 1:36 pm
As far as any 1099-B goes, some items are not directly reported to the IRS.  But for the lines that are reported to the IRS, would you feel obligated to enter what's reported and then adjust the numbers according to your account methods?  It seems that you'd benefit from reconciling the numbers on your return.
[/QUOTE]

Sorry, I don't understand the question. I've always been able to enter the numbers on the 1099s into my tax software. What we've been discussing isn't related to entering numbers from the 1099-B into the tax software 1099-B, but what to enter as the accrued market discount adjustment, which is on the next screen, and which is either the amd reported by the broker (so on the 1099-B), or calculated as the difference of the proceeds and cost (each number also on the 1099-B, but a calculation is required unless the broker happens to put this value in the gain/loss column) (either one with a minus sign in front of it).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: erp wrote: Sat Dec 16, 2023 7:32 pm]
erp wrote: Sat Dec 16, 2023 7:32 pm
Here's the 1099b I found that shows sales with accrued market discount from your post  viewtopic.php?p=6955743#p6955743.  Maybe it's from a different broker than you just mentioned since it does net out the gain correctly, 
[/QUOTE]

Yep, that's the Schwab 1099-B, and as I mentioned, they show the adjusted gain (proceeds - cost - acc mkt disc) in that column, which is why I said to ignore that column in doing your taxes.

The key for me this time was to look at my statement showing the purchase, and verify that the cost/basis shown on 1099-B is the purchase amount (not including amortized interest).

As I pointed out, to the extent that stcg and interest are taxed the same, you end up with the same result even if you enter the accrued market discount instead of the (smaller) gain as the adjustment. But as you point out, it could make a difference to the extent there is a net difference on either the fed or state return due to differences in the way they are handled.

Incidentally, as we've discussed in this thread multiple times, you need to enter a dummy 1099-INT to report the accrued market discount adjustment as interest on Schedule B--at least you do with HRBlock, so don't forget that step if you want to report things correctly.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kevin M wrote: Sat Dec 16, 2023 2:34 pmerp wrote: Sat Dec 16, 2023 1:30 pmKevin M wrote: Sat Dec 16, 2023 12:51 pm]
Kevin M wrote: Sat Dec 16, 2023 2:34 pm
erp wrote: Sat Dec 16, 2023 1:30 pm
Kevin M wrote: Sat Dec 16, 2023 12:51 pm
1e Basis: 1,907

GIGO?  Enter the correct basis of 1,892.88 and you will get the correct answer

a -6.26 in col (g) of the 8949 making the cap gain for the sale = $0.

and 6.26 interest on Sch B.

This has been discussed several times by the 3 I quoted, but doesn't seem to stick?

You are saying that the basis is not increased by the accrued market discount, which is not consistent with my understanding.

[/QUOTE]

I looked at my 1099-Bs from Schwab and Fidelity for 2019, a year in which I sold a number of Treasuries before maturity. I compared the cost/basis shown on Fido 1099-B to the purchase amounts minus accrued interest shown on my statements. From these I can confirm that the basis reported on 1099-B is indeed the purchase price--not adjusted by the accrued market discount as I thought it was.

Since I have the Fidelity 1099-B, let's get back to the OP's questions, which are related to the Fidelity 1099-B.

[QUOTE: Drew31 wrote: Fri Dec 15, 2023 4:07 pm]
Drew31 wrote: Fri Dec 15, 2023 4:07 pm
The Short Term Gain is $6.26, but under the Accrued Market Discount, it's listed as $13.68.  

Again, these amounts are just stupid small, but I'm more so just trying to learn and anticipate what this looks like on my 1099 and return.  Which value will I be using and is there something that I do with the difference?
[/QUOTE]

[QUOTE: Drew31 wrote: Fri Dec 15, 2023 7:20 pm]
Drew31 wrote: Fri Dec 15, 2023 7:20 pm
Bought in July with total cost of $1,903.53 ($1,892.88 + $10.65 accrued interest)
September receive Coupon of $17.50
Shortly thereafter in September, I sell with proceeds of $1,900.10 ($1,899.14 + $0.96 in accrued interest).

If I take the difference between 1899.14 & 1892.88 I get my short term cap gain of $6.26.

My total interest is going to be I assume my coupon (17.50) less my accrued discount paid at purchase (10.65) plus the accrued interest received at sale (0.96) = $7.81

What I cannot calculate is where the $13.68 accrued market discount is coming from.
[/QUOTE]

We've figured out the last question. As to the 1099, here's what will be on the 1099-B

1d - Proceeds: 1,899.14

1e - Cost or other basis: 1,892.88

1f - Accrued market discount: 13.68

Fidelity also includes a column for realized gain, which they calculate as proceeds minus cost, so it's the unadjusted gain (Schwab shows the adjusted gain, so proceeds - cost - acc mkt disc). Whatever is shown in this column doesn't matter, since it should not be entered anywhere in the tax software (it would work as the opposite of the acc mkt dsc adjustment for Fido, but not for Schwab).

In your case, unadjusted gain is proceeds minus cost = 6.26. 

Per the instructions for 8949, you enter the smaller of the unadjusted gain or the accrued market discount as a negative adjustment to capital gain, and report this amount as interest on Schedule B, as erp has informed us.

Without looking at my 2019 tax return, I'm guessing that I did this wrong, and entered the accrued market discount as the adjustment amount. In this case, with your numbers I would have reported a short-term capital gain/loss of -7.42 and interest of 13.68, for a net of 6.26 on which I paid income tax. Since the STCG rate is the same as the ordinary income rate, the IRS got the same amount of money as if I'd done it correctly. Of course I never received any correction notice for this.

The HRBlock software instructions are correct for this, so if any of us using HRBlock software click the LEARN MORE link on the market discount adjustment screen, we'll see this:

[QUOTE]
Market Discount Adjustment

Leave this screen blank if you chose to include market discount in income currently.

Otherwise, your market discount amount depends on if you received a partial payment of principal:
* If so, enter the smaller of these:
**Accrued market discount, shown on Form 1099-B, Box 1f 
**Your proceeds 

*If not, enter the smaller of these, but not less than zero:
**Accrued market discount, shown on Form 1099-B, Box 1f
**Sale proceeds minus basis (make any necessary basis corrections first)
[/QUOTE]

(Underline mine -- the part that applies to this scenario).

So, if we enter everything correctly, click LEARN MORE, and pay attention to what it says, we'll be doing it correctly.

Sure, we've probably covered this before, but I don't recall ever digging into my actual 2019 numbers this thoroughly. I'll probably forget this, and it probably will come up again, but at least I'll be doing at least one return in a few months with sales of Treasuries in 2023, so that should help me remember at least through mid 2024.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: erp wrote: Sat Dec 16, 2023 1:30 pmKevin M wrote: Sat Dec 16, 2023 12:51 pm]
erp wrote: Sat Dec 16, 2023 1:30 pm
Kevin M wrote: Sat Dec 16, 2023 12:51 pm
1e Basis: 1,907

GIGO?  Enter the correct basis of 1,892.88 and you will get the correct answer

a -6.26 in col (g) of the 8949 making the cap gain for the sale = $0.

and 6.26 interest on Sch B.

This has been discussed several times by the 3 I quoted, but doesn't seem to stick?
[/QUOTE]

You are saying that the basis is not increased by the accrued market discount, which is not consistent with my understanding.

Can you provide links to references that clarify this? If this has been definitively resolved in previous discussions, as you imply, could you provide links to those discussions?

The instructions for 1099-B say this regarding reporting basis:

[QUOTE]
For a debt instrument, see Regulations sections 1.6045-1(n)(7) and 1.6045-1(n)(11) for the rules to determine adjusted basis for a debt instrument acquired at a premium or discount.
[/QUOTE]

I find those sections of the CFR a bit confusing. First this:

[QUOTE]
(iv) Market discount. See paragraph (n)(6) of this section for rules to determine the adjusted basis of a debt instrument with market discount.
[/QUOTE]

OK, here's the relevant portion of (n)(6)

[QUOTE]
(6) Reporting of accrued market discount. In addition to the information required to be reported under paragraph (d) of this section, if a debt instrument is subject to the market discount rules in sections 1276 through 1278, a broker also must report the information described in paragraph (n)(6)(i) or (n)(6)(ii) of this section, whichever is applicable. Such information must be shown in the manner and at the time required by Form 1099 and section 6045.

(i) Sale. A broker must report the amount of market discount that has accrued on a debt instrument as of the date of the instrument's sale, as defined in paragraph (a)(9) of this section. See paragraphs (n)(5) and (n)(11)(i)(B) of this section to determine whether the amount reported should take into account a customer election under section 1276(b)(2). See paragraph (n)(8) of this section to determine the accrual period to be used to compute the accruals of market discount. This paragraph (n)(6)(i) does not apply if the customer notifies the broker under the rules in paragraph (n)(5) of this section that the customer elects under section 1278(b) to include market discount in income as it accrues.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: erp wrote: Sat Dec 16, 2023 11:18 amKevin M wrote: Sat Dec 16, 2023 10:58 amFactualFran wrote: Sat Dec 16, 2023 10:57 amArtsdoctor wrote: Sat Dec 16, 2023 9:37 am]
erp wrote: Sat Dec 16, 2023 11:18 am
Kevin M wrote: Sat Dec 16, 2023 10:58 am
If the accrued market discount shown is correct, you'll have a STC loss, not a gain.
FactualFran wrote: Sat Dec 16, 2023 10:57 am
There will be a short-term loss of 7.42, the sale principal of 1,899.14 minus the basis.
Artsdoctor wrote: Sat Dec 16, 2023 9:37 am
2. If your sales price was more or less that that accrued market discount, you'd have a gain or loss, respectively. And it would be short-term.

Why is this misinfo repeated over and over again in the thread that is supposed to clear up things like this, by the very people who drive this thread?

Accrued market discount are capped by the short term gains.  In this case, depending on how your 1099 is reported (they may adjust the numbers for you, or they may just fill in column 1f), you may need to use "Worksheet for Accrued Market Discount Adjustment in Column (g)" to calculate the right entries.  https://www.irs.gov/instructions/i8949# ... 1000114436

The end result will be that you will have an entry on your 8949 showing $0 gain, and $6.26 of interest on your schedule B (plus other interest for the coupon).
[/QUOTE]

Let's walk through it using the 8949 instructions you linked to. I actually entered all of this into HRBlock software to check; the software rounds all entered numbers to the closest dollar, which is what I'll show here. I'll assume that the broker reports the correct basis, which is purchase price plus accrued market discount, and I'll assume that the accrued market discount shown by the broker is correct (even though it may not be).

Numbers reported on 1099-B:

1d Proceeds: 1,899

1e Basis: 1,907

1f Acc mkt disc.: 14

Worksheet for Accrued Market Discount Adjustment in Column (g):

1. 	Enter the proceeds from box 1d of Form 1099-B (or substitute statement) 	1. 	__1,899___

2. 	Enter the basis from box 1e of Form 1099-B (or substitute statement) 	2. 	__1,907___

3. 	Subtract line 2 from line 1. If zero or less, enter -0- 	3. 	__0__

4. 	Enter the accrued market discount from box 1f of Form 1099-B (or substitute statement) 	4. 	__14___

5. 	Enter the smaller of line 3 or line 4, or, if lines 3 and 4 are the same, enter the amount from line 3. This is the amount of your gain that is ordinary income. Enter it as a negative amount (in parentheses) in Form 8949, column (g). Also, report it as interest income on your tax return. If zero or less, enter -0- 	5. 	__0___

I underlined the key part. So, you won't report anything as interest income, and the gain shown on 8949 is -8.

Note that I didn't say anything about reporting the market discount as interest, but only using it to adjust the basis, resulting in a negative gain, which is correct per the 8949 instructions.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Drew31 wrote: Sat Dec 16, 2023 11:14 am]
Drew31 wrote: Sat Dec 16, 2023 11:14 am
And it appears I was using the "ratable" method, but have obviously messed up the math/dates somehow since I'm still off by a little bit in matching my calculated accrued discount to what Fidelity shows.  

I think the message is clear though - whatever is showing online is going to be adjusted so just wait for the 1099.  Appreciate the replies to think this through.

EDIT: Re-reading FactualFran's post, I see where he mentioned that the brokerage amount may have been using the constant yield method, hence the difference versus what I did.
[/QUOTE]

Could be.

Be sure to use settlement dates, not trade dates, in your calculations. For example 9/15 was a Friday, and that would be the correct date to use if the trade was on Thursday, the day before. If the trade date was 9/15, settlement would have been Monday, 9/18.

At any rate, messing around with the dates a bit, I can't come up with their number using ratable accrual, so either they used constant yield (for reasons I can't fathom), or they just made another mistake, like they did with the STCG.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=100

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Sat Dec 16, 2023 10:57 am]
FactualFran wrote: Sat Dec 16, 2023 10:57 am
The value corresponds to the brokerage having used the constant yield method (the link is to a section of IRS Publication 1212 that is specifically about accruing Original Issue Discount (OID), but the same method is used for accruing market discount).
[/QUOTE]

Per my reply posted a minute after yours, the ratable accrual method is the default for accrued market discount. You can elect to use the constant yield method, but I wouldn't do so since it's more complicated.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Drew31 wrote: Sat Dec 16, 2023 5:59 amFactualFran wrote: Fri Dec 15, 2023 11:05 pmDrew31 wrote: Fri Dec 15, 2023 7:20 pm]
Drew31 wrote: Sat Dec 16, 2023 5:59 am
FactualFran wrote: Fri Dec 15, 2023 11:05 pm
Drew31 wrote: Fri Dec 15, 2023 7:20 pm
Ok - I dug into to my purchase history on this one so I can give more details....

CUSIP 91282CED9

Bought in July with total cost of $1,903.53 ($1,892.88 + $10.65 accrued interest)
September receive Coupon of $17.50
Shortly thereafter in September, I sell with proceeds of $1,900.10 ($1,899.14 + $0.96 in accrued interest).

If I take the difference between 1899.14 & 1892.88 I get my short term cap gain of $6.26.

My total interest is going to be I assume my coupon (17.50) less my accrued discount paid at purchase (10.65) plus the accrued interest received at sale (0.96) = $7.81

What I cannot calculate is where the $13.68 accrued market discount is coming from.

Presumably, you bought $2,000 of face value.  The purchase discount was $107.12 ($2,000 - $1,892.88).  The full discount would have accrued between purchase and maturity.  Less than the full discount had accrued between purchase and sale.

Thanks. Correct on the $2k face value. That makes sense on the purchase discount but then how do I reconcile to get my 13.68 accrued market discount? Or is that calculable. 

What confuses me is how I’d be paying tax on an additional 13.68 because based on actual inflows/outflows, I didn’t receive an extra 13.68 anywhere. 

Again, these are obviously tiny numbers but enjoy learning and understanding this stuff so finally decided I’d post to see if I’d get some clarity prior to 1099s being issued. And to Kevin’s point, I know the online data can sometimes adjust.
[/QUOTE]

I'll just repeat: ignore what you see on the website now. It appears that the STCG is being calculated incorrectly.

Your basis is increased by the amount of accrued market discount. From Publication 550 (2022), Investment Income and Expenses | Internal Revenue Service:

[QUOTE]
Effect on basis.

You increase the basis of your bonds by the amount of market discount you include in your income.
[/QUOTE]

So your purchase price is not the basis, and the gain is not sales price minus purchase price. Your basis is greater than purchase price, so gain will be smaller than is being calculated by using those two numbers. If the accrued market discount shown is correct, you'll have a STC loss, not a gain.

If you provide the settlement dates, we can calculate the accrued market discount, use that to adjust your basis, then calculate the gain or loss. Or you can do it yourself. Again, from Pub 550:

[QUOTE]
Accrued market discount.

The accrued market discount is figured in one of two ways.

Ratable accrual method.

Treat the market discount as accruing in equal daily installments during the period you hold the bond. Figure the daily installments by dividing the market discount by the number of days after the date you acquired the bond, up to and including its maturity date. Multiply the daily installments by the number of days you held the bond to figure your accrued market discount.

Constant yield method.

Instead of using the ratable accrual method, you can choose to figure the accrued discount using a constant interest rate (the constant yield method). Make this choice by attaching to your timely filed return a statement identifying the bond and stating that you are making a constant interest rate election. The choice takes effect on the date you acquired the bond. If you choose to use this method for any bond, you cannot change your choice for that bond.

For information about using the constant yield method, see Constant yield method under Debt Instruments Issued After 1984 in Pub. 1212. To use this method to figure market discount (instead of OID), treat the bond as having been issued on the date you acquired it. Treat the amount of your basis (immediately after you acquired the bond) as the issue price and apply the formula shown in Pub. 1212.
[/QUOTE]

I assume you will use the ratable accrual method, since it's simpler.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Drew31 wrote: Fri Dec 15, 2023 4:07 pm]
Drew31 wrote: Fri Dec 15, 2023 4:07 pm
I sold a few T-Notes this year that I bought on secondary market before maturity. First time doing so and dollar amounts are small but I'm curious as I'm reviewing Tax Info on Fidelity.  Here's what's throwing me off...

They show under both the Net Short-Term Gain Section AND the Realized Accrued Market Discount Income sections...but with different amounts.

Using one bond as an example:

The Short Term Gain is $6.26, but under the Accrued Market Discount, it's listed as $13.68.  

Again, these amounts are just stupid small, but I'm more so just trying to learn and anticipate what this looks like on my 1099 and return.  Which value will I be using and is there something that I do with the difference?
[/QUOTE]

I generally ignore whatever the websites show, but it's likely that you'll have both some accrued market discount income and some short term capital gain or loss.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Thu Dec 14, 2023 1:59 pmnalor511 wrote: Wed Dec 13, 2023 5:43 pm]
cas wrote: Thu Dec 14, 2023 1:59 pm
nalor511 wrote: Wed Dec 13, 2023 5:43 pm
My question is, is it proper to put the -$100 adjustment on ty2024 because that's the first year that this tnote will pay me interest, or in ty2023 because I'll still have other Treasury interest to adjust against and it's a 2023 tax document?

Previous thread where MarkNYC (CPA) answers this question:  Reporting Accrued Bond Interest Paid

Previous post on this thread where I say what I do: viewtopic.php?p=6968284#p6968284

Kevin M doesn't like what MarkNYC and I say and takes a different approach, but you'd have to scan through this thread to find where he posts about it.   I seem to recall quite a lot of discussion about various aspects of this (in this thread) when people were preparing their 2022 taxes in the March-ish 2023 time frame.
[/QUOTE]

It's not that I don't like it, it's just that it's enough of a gray area, and one unlikely to be challenged by the IRS, especially for smaller amounts, that I'm comfortable deducting the accrued interest paid to seller if I have other interest from the broker I can deduct it against. Simplifies the bookkeeping. If I don't have enough other interest, I make a note in my tax spreadsheet to be sure to deduct it in the following tax year.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Mon Dec 11, 2023 4:39 pmArtsdoctor wrote: Mon Dec 11, 2023 3:56 pm]
cas wrote: Mon Dec 11, 2023 4:39 pm
Artsdoctor wrote: Mon Dec 11, 2023 3:56 pm

Would this not be a reasonable way to handle it?

For people wanting to starting getting oriented on this whole "income in respect of decedent" concept for cash basis decedents and income that had accrued but had not been received at death,  I recommend starting with:

-"Strategies for Minimizing the Impact of Income in Respect of a Decedent", published by a professional accounting association.    I think you will find items in this short article that help you analyze your scenario.
[/QUOTE]

I find it interesting that bond accrued market or acquisition discount is not discussed in the article you linked. You'd think that this would be one of the more common items of IRD, if that's indeed what it is.

From a common sense perspective, treating discounts that would be taxed as income to the decedent makes sense, since the general idea of the basis step up is to eliminate capital gains tax on inherited assets.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: nalor511 wrote: Mon Dec 11, 2023 2:54 pmKevin M wrote: Mon Dec 11, 2023 2:49 pmnalor511 wrote: Mon Dec 11, 2023 1:18 pm]
nalor511 wrote: Mon Dec 11, 2023 2:54 pm
Kevin M wrote: Mon Dec 11, 2023 2:49 pm
nalor511 wrote: Mon Dec 11, 2023 1:18 pm
I know that if a treasury bill/note/bond matures or is sold, the ratable share is taxed as interest, and the remainder (if any) is taxed as capital gains.

In the event that a treasury bond is inherited, does the basis step up to market value at the date of death like other securities?

Yes.

The poster above you basically said the opposite
[/QUOTE]

Right--that got posted before I quoted your post to reply to it. I hadn't read the linked threads, and there are some interesting points made there. Bottom line is it sounds like there has been no authoritative input from a knowledgeable estate attorney so far, so it seems like an unresolved issue.

My inclination would be to step up the basis.

Some of the examples discuss accrued interest as being income in respect of the decedent, but from my quick read, it seems like that very well could be referring to accrued coupon interest accrued up to the date of death. That makes sense, since accrued coupon interest is not part of a bond's market value; i.e., it's not included in the price quoted on the secondary market. One of the references discusses how to find the market value of a bond for purposes of establishing the basis, which supports my inclination.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: nalor511 wrote: Mon Dec 11, 2023 1:18 pm]
nalor511 wrote: Mon Dec 11, 2023 1:18 pm
I know that if a treasury bill/note/bond matures or is sold, the ratable share is taxed as interest, and the remainder (if any) is taxed as capital gains.

In the event that a treasury bond is inherited, does the basis step up to market value at the date of death like other securities?
[/QUOTE]

Yes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: dual wrote: Fri Oct 27, 2023 11:47 am]
dual wrote: Fri Oct 27, 2023 11:47 am
Kevin M
Assume discount is state tax exempt, unless you're domiciled in one of the very few states that explicitly say it's not,

I did a search and the only state I could find that says it is taxable is Illinois

https://ttlc.intuit.com/community/state ... 00/1333674

Please list other states that you are aware of.
[/QUOTE]

I don't pay much attention to this, since I'm in CA, and I don't pay state income tax on Treasury accrued market discount.

I seem to recall that one of the Carolinas was mentioned. A quick web search find's that it's North Carolina, mentioned on page 11 of this thread, and apparently elsewhere in the thread. Here's the link to the first post I found: viewtopic.php?p=7462910#p7462910. I vaguely recall that someone started a thread specifically about this, but not sure.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Basic Question About How Treasuries Are Taxed
			
[QUOTE: smartinvestor2020 wrote: Fri Oct 27, 2023 10:17 amcas wrote: Fri Oct 27, 2023 10:03 am]
smartinvestor2020 wrote: Fri Oct 27, 2023 10:17 am
cas wrote: Fri Oct 27, 2023 10:03 am
The Taxation of Treasury bills, notes and bonds megathread should be useful to you.

A portion of the first post addresses the bulk of your question:

Treasury notes and bonds are more complicated because they pay interest semi-annually (coupon payments), and there also can be a market discount or premium when you buy.

The coupon payments are reported on 1099-INT in box 3, which is for Treasury obligation interest. This is exempt from state and local income tax

The market discount or premium is accrued or amortized respectively.

Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.

[. . .]

One can make an election to report accrued market discount annually instead of at maturity. See IRS Pub 550 for details. 

Then there is discussion of other questions that come up, e.g. exactly how to do the tax reporting in various tax software packages, in the rest of the (admittedly long) thread.

So if I understand you, it looks like individual treasuries are much less tax efficient when you select low coupon rates because the gain in price from the discounted price is possibly subject to state and local taxes. How do I determine if my state taxes this gain or not? I assume the gain is taxed like ordinary income. Is this correct?
[/QUOTE]

I would say that this is not correct, generally.

Low coupon Treasuries are attractive if you want to defer a large portion of the tax to the year of maturity. I think this type of tax deferral is considered "efficient" by many, since you don't have the "tax drag" of paying tax annually. The longer the maturity, the more efficient in this sense.

Also, I would simply file state tax returns assuming that the accrued market discount is state tax exempt, unless you're domiciled in one of the very few states that explicitly say it's not, and even then there appears to be some doubt, so I might do so even in one of those states.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: How do you forecast/pay for TIPS taxes in practice?
			
[QUOTE: Kinkajou82 wrote: Thu Oct 12, 2023 11:58 amjeffyscott wrote: Thu Oct 12, 2023 11:20 amKinkajou82 wrote: Thu Oct 12, 2023 6:57 am]
Kinkajou82 wrote: Thu Oct 12, 2023 11:58 am
jeffyscott wrote: Thu Oct 12, 2023 11:20 am
Kinkajou82 wrote: Thu Oct 12, 2023 6:57 am
One of my gaps of knowledge/comfort with individual TIPS is that I'm having trouble picturing how I'd account for or handle their taxes... 

TIPS aren't specifically mentioned in the title of the “Taxation of Treasury bills, notes and bonds” discussion, but searching that for "TIPS"  turned up a couple pages of potentially relevant posts: 
search.php?keywords=tips&t=390405&sf=msgonly

Thank you!

So I AM still interested in HOW people pay their TIPS taxes. Do you just plan to cash flow it and hope a year isn't higher than expected? Since it's essentially unpredictable there's no easy way to create an accurate liability matching ladder/sinking fund for it, is there?

Specifically, I'm curious if there's any practical advice to protect oneself from overbuying TIPS (like in a 30 year ladder) and then getting surprised/behind the eightball come tax time for the next 30 years.
[/QUOTE]

Some family members hold TIPS in taxable, but their situation isn't too relevant to what I think you're asking. They have income and other assets, so paying taxes on the inflation adjustments isn't an issue. Also, we aren't going out than more than a few years with TIPS at this point, and if they had to, they could use some of the proceeds from the TIPS maturing in Jan 2023 to cover the taxes on the inflation adjustments of their other TIPS.

One thing to keep in mind is that the value of your TIPS that mature each year will reflect the same inflation adjustment as the rest of your TIPS. Taxes are one of the liabilities that you're matching, so the inflation adjustment of the maturing TIPS will help with taxes on the inflation adjustment of the rest of them. Still, it may not be a good idea to hold TIPS in taxable without other assets to help with taxes if inflation is unexpectedly high.

Of course if you have the tax-advantaged space, holding TIPS in that is preferred.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: How do you forecast/pay for TIPS taxes in practice?
			
[QUOTE: jeffyscott wrote: Thu Oct 12, 2023 11:20 amKinkajou82 wrote: Thu Oct 12, 2023 6:57 am]
jeffyscott wrote: Thu Oct 12, 2023 11:20 am
Kinkajou82 wrote: Thu Oct 12, 2023 6:57 am
One of my gaps of knowledge/comfort with individual TIPS is that I'm having trouble picturing how I'd account for or handle their taxes... 

TIPS aren't specifically mentioned in the title of the “Taxation of Treasury bills, notes and bonds” discussion, but searching that for "TIPS"  turned up a couple pages of potentially relevant posts: 
search.php?keywords=tips&t=390405&sf=msgonly
[/QUOTE]

Right. TIPS are Treasury notes and bonds, and are mentioned in the OP of that thread, as are STRIPS.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			^Artsdoctor provided the best answer you're going to get, IMO.

Seems to me that the amounts of STGC/L that you might incur are small enough that it shouldn't tip the scale one way or the other in terms of need to file a state tax return. Most of the income will be Treasury interest, exempt from state income tax.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MacktheKnife wrote: Wed Sep 27, 2023 6:24 pmKevin M wrote: Wed Sep 27, 2023 4:37 pmMacktheKnife wrote: Wed Sep 27, 2023 4:00 pm]
MacktheKnife wrote: Wed Sep 27, 2023 6:24 pm
Kevin M wrote: Wed Sep 27, 2023 4:37 pm
MacktheKnife wrote: Wed Sep 27, 2023 4:00 pm
Thank you both.  That helps.  I'm on the front end of setting up a brokerage account that will consist entirely of T-bills and a small core Government Money Market account at Fidelity.  This is for a person that I am serving as POA.  For various reasons (that I don't care to discuss), we are trying to limit earnings to being state tax exempt to the maximum extent possible.  With Fidelity, I can get virtually all of the assets in 4 week T-bills on auto-roll.  That means that as I need to pull funds on a monthly basis, I can likely just let them roll and sell off what is needed in the secondary market without incurring any meaningful state-taxable income.

Example:  account consists of $400K with $100K groupings of 4-week bills, one maturing each week.  If I need to carve off $5K of cash to transfer to a checking account, I can just sell $5K from any of the legs in the secondary market without screwing up Fidelity's nifty "never out of the treasuries" auto -roll process.  Does that make sense?    

Thanks for responding Kevein.

I would use proceeds from maturing bills rather than sell on secondary. You'll lose enough to the bid/ask spread that your rate of return is likely to be less than the original yield, but it also depends on how rates move.

The problem with this is that if I have very little in the money market (I plan to, since that generated state tax liability) I won't have assets to return the remainder of the maturing funds to T-Bills until the next week.  This would compound the state tax concerns.

You can cancel the auto roll, let the bills mature, and enter a new auction order for fewer bills. If you have enough in the MM fund to cover the new order, you can do it online. Unfortunately Fidelity does not "see" the maturing bills as available for rolling into more Treasuries; Vanguard and Schwab do.

See above.

Since you'd be OK selling on secondary, you should be OK buying on secondary, which eliminates the hassles of what you're trying to do with auto roll.

I would prefer to let them all auto-roll and then just sell off in the secondary market what I need.  Why would that be more "hassles" than letting a whole batch mature and then rebuying on the secondary market?  If I need 10% of a maturing batch.  I pay bid/ask on 10%.  If I do it your way, wouldn't I be paying bid/ask on 90%?

What I do is have a ladder with rungs maturing monthly. On the trading day before maturity, I decide how much of the maturing proceeds I want to reinvest, and I enter an order for a Treasury at the long end of the ladder. I do everything on secondary, since I can buy what I want when I want, and am not subject to auction timing.
That's why I want to let auto-roll do its thing to the maximum extent possible.  If I had told you that I wasn't planning to keep any meaningful funds in the money market, would you have seen more value in my approach?
[/QUOTE]

Move the account to Schwab. There you can buy with funds that settle on or before the settlement date of the maturing Ts. So if you have 20 maturing next week, and you want to cash out 10 for spending, you can place an auction order for 10, and Schwab "sees" that you have 20 maturing on the same settlement date, so will let you place the order.

Or just do it your way.

I don't like auto roll because I can't do a rolling ladder with it, in general. When my Treasuries mature, I buy at the long end of my ladder, and that might be a year or 18 months out. It may meet your needs though.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MacktheKnife wrote: Wed Sep 27, 2023 4:00 pm]
MacktheKnife wrote: Wed Sep 27, 2023 4:00 pm
Thank you both.  That helps.  I'm on the front end of setting up a brokerage account that will consist entirely of T-bills and a small core Government Money Market account at Fidelity.  This is for a person that I am serving as POA.  For various reasons (that I don't care to discuss), we are trying to limit earnings to being state tax exempt to the maximum extent possible.  With Fidelity, I can get virtually all of the assets in 4 week T-bills on auto-roll.  That means that as I need to pull funds on a monthly basis, I can likely just let them roll and sell off what is needed in the secondary market without incurring any meaningful state-taxable income.

Example:  account consists of $400K with $100K groupings of 4-week bills, one maturing each week.  If I need to carve off $5K of cash to transfer to a checking account, I can just sell $5K from any of the legs in the secondary market without screwing up Fidelity's nifty "never out of the treasuries" auto -roll process.  Does that make sense?
[/QUOTE]

I would use proceeds from maturing bills rather than sell on secondary. You'll lose enough to the bid/ask spread that your rate of return is likely to be less than the original yield, but it also depends on how rates move.

You can cancel the auto roll, let the bills mature, and enter a new auction order for fewer bills. If you have enough in the MM fund to cover the new order, you can do it online. Unfortunately Fidelity does not "see" the maturing bills as available for rolling into more Treasuries; Vanguard and Schwab do.

Since you'd be OK selling on secondary, you should be OK buying on secondary, which eliminates the hassles of what you're trying to do with auto roll.

What I do is have a ladder with rungs maturing monthly. On the trading day before maturity, I decide how much of the maturing proceeds I want to reinvest, and I enter an order for a Treasury at the long end of the ladder. I do everything on secondary, since I can buy what I want when I want, and am not subject to auction timing.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MacktheKnife wrote: Wed Sep 27, 2023 2:22 pmKevin M wrote: Tue Nov 15, 2022 7:26 pm]
MacktheKnife wrote: Wed Sep 27, 2023 2:22 pm
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Treasury bills are the easiest to understand. Say you pay $990 for $1,000 of face value (this is the minimum at a broker). At maturity you'll receive $1,000; $10 of this will be reported as interest in box 3 of 1099-INT for the year of maturity. IRS publications refer to this $10 as accrued acquisition discount. 

Treasury bill interest (accrued acquisition discount) is exempt from state and local income tax, as is anything reported in box 3 of 1099-INT. All of this is true whether you buy at auction or on the secondary market.

Thanks again for the excellent thread Kevin.  I have a basic question.  Apologies if it has already been covered.

I buy a 4 week T-bill for $995.xx
I hold it two weeks and sell it on the secondary market.

Did I:
a) just incur $2.xx in interest that is exempt from state taxes.
b) just incur $2.xx in capital gains that is taxable in most states.

Thanks.
[/QUOTE]

Depends how much you sell it for. The accrued acquisition discount is interest, and any difference is short-term cap gain or loss. The interest part would be about $2.50, since you held it for half of the period from acquisition to maturity. I'm assuming you mean you buy it at auction.

The interest part should count as Treasury interest in all states, but I'm not a specialist in state tax laws.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: CrisisAverted wrote: Fri Sep 15, 2023 2:32 pm]
CrisisAverted wrote: Fri Sep 15, 2023 2:32 pm
I have only purchased treasuries on the secondary market and only tbills with maturity dates in the same calendar. 

If I get some long dated treasuries, possibly multi-year, how is the tax applied to that?

Does it matter if it is on the secondary market versus new issue? Does it matter if there is a coupon involved?

Not exactly sure how to buy these for long duration to minimize taxable impact, if it even all possible.

Interest is paid out annually-- would that mean that I am forced to pay taxes on the interest annually, as well? Could I defer it until the final maturity date?
[/QUOTE]

Start by reading the OP of this thread. Anything with maturity > 1 year is a note or bond, so that's the section that's relevant. From the OP:

[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pm

Treasury notes and bonds are more complicated because they pay interest semi-annually (coupon payments), and there also can be a market discount or premium when you buy.

The coupon payments are reported on 1099-INT in box 3, which is for Treasury obligation interest. This is exempt from state and local income tax.
[/QUOTE]

So interest is paid semi-annually, not annually, and all such payments are included in your 1099-INT. You pay income tax on anything reported on 1099-INT, so no, you cannot defer taxes on these interest payments.

Continuing with the OP:

[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pmThe market discount or premium is accrued or amortized respectively.

Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.

From Pub 550:

Market discount bonds.

Report the sale or trade of a market discount bond on Part I or Part II of Form 8949, whichever is appropriate. See the table How To Complete Form 8949, Columns (f) and (g), in the Instructions for Form 8949 to help you figure the amounts to report for a sale or trade of a market discount bond. Use the Worksheet for Accrued Market Discount Adjustment in Column (g) in those instructions to figure the adjusted accrued market discount. Also report the amount of accrued market discount as interest income on Schedule B (Form 1040), line 1, and identify it as “Accrued Market Discount.” See the Instructions for Form 8949 for more information. 

One can make an election to report accrued market discount annually instead of at maturity. See IRS Pub 550 for details. From the Pub:
Choosing to include market discount in income currently.

You can make this choice if you have not revoked a prior choice to include market discount in income currently within the last 5 calendar years. Make the choice by attaching to your timely filed return a statement in which you:

    State that you have included market discount in your gross income for the year under section 1278(b) of the Internal Revenue Code, and

    Describe the method you used to figure the accrued market discount for the year.

Once you make this choice, it will apply to all market discount bonds you acquire during the tax year and in later tax years. You cannot revoke your choice without the consent of the IRS. See Rev. Proc. 2022-14 for information on how to revoke your election.
[/QUOTE]

So, unless you elect to pay tax on accrued market discount annually, you'll pay it in the year the note/bond is disposed of (matures or is sold).

If you want to defer as much tax as possible, but a Treasury with a very low coupon. This minimizes the coupon interest you receive semi-annually, and the price will be well below 100, meaning that most of your return will be in the form of accrued market discount, on which you can pay tax at maturity.

Example. CUSIP 912828ZE3 is a Treasury maturing 3/31/2027, with a coupon of 0.625%. The yield (to maturity) is 4.642%, so about 4% of that will be returned as accrued market discount at maturity, and only 0.625% would be taxed annually (unless you elect to pay tax on accrued market discount annually, which would defeat the purpose). The price is  87.05743; it's the difference between 100 and this value that you earn as accrued market discount per $100 of bond value. So for one bond, you pay 870.57, and get back 1,000 at maturity. You also pay 2.94 in accrued interest to the seller, but you get that back with your first coupon payment of $6.25 $3.125 per bond.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: 3 Yr Treasury bought on secondary market and held to maturity. Why is it a Cap Gain?
			
[QUOTE: LookinAround wrote: Fri Sep 15, 2023 7:01 am]
LookinAround wrote: Fri Sep 15, 2023 7:01 am
[Thread merged into here --admin LadyGeek]

On 6/6/2022 I went through the exercise of buying a 3-year Treasury (CUSIP 912828ZD5) on the secondary market. Face value $4,000.

It matured on 3/15/2023. I just noticed Schwab lists the $46.16 difference between discount and face value as a short term Cap Gain. I thought if held to maturity it's categorized as Treasury interest? Did Schwab make a mistake or am I not understanding something?
[/QUOTE]

Lists it where? Do not rely on whatever is shown for tax purposes. When you get your composite 1099, you'll see that the way it's reported is as discussed in the megathread your thread has been merged into .

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: 3 Yr Treasury bought on secondary market and held to maturity. Why is it a Cap Gain?
			
[QUOTE: thomas716 wrote: Fri Sep 15, 2023 7:14 am]
thomas716 wrote: Fri Sep 15, 2023 7:14 am
When you buy a bond at a discount, the difference between the purchase price and the par value is going to be a capital gain.  When it matured, you should’ve received the final interest payment and the $4000 for the bonds, which was their face value.  Since you held it for less than a year, you would have a short term capital gain.
[/QUOTE]

This is not correct. Any subsequent discussion based on this false premise should be ignored.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Drew31 wrote: Tue Jul 18, 2023 12:23 pmKevin M wrote: Tue Jul 18, 2023 12:05 pmDoc wrote: Tue Jul 18, 2023 11:04 amCrisisAverted wrote: Tue Jul 18, 2023 2:23 am]
Drew31 wrote: Tue Jul 18, 2023 12:23 pm
Kevin M wrote: Tue Jul 18, 2023 12:05 pm
Doc wrote: Tue Jul 18, 2023 11:04 am
CrisisAverted wrote: Tue Jul 18, 2023 2:23 am
Is it possible to buy a treasury bill that's long dated but acts like a treasury bill to where there's no coupon or accrued interest to have to worry about but no need to worry about interest posting anytime soon?

There are long date Treasury BILLS. By definition a T-Bill has a maturity of 52 weeks or less.

That said there are zero coupon (stripped) Treasury notes and bonds. You can purchase these on the secondary market. There will be no coupon payments but you might have to pay tax on the accrued interest. I'll let the tax gurus opine on that aspect.

Right. Zero-coupon bonds are "market discount bonds". Read about taxation of these bonds here: Market discount bonds--IRS Pub 550.

Bottom line is that you can elect to report accrued market discount as interest in each tax year it's accrued, or if you don't make the election, you report it as interest income in the tax year you dispose of it (sell it or it matures).

Does this apply to STRIPS?  I thought with STRIPS, you DO pay the interest as it accrues each year?  Maybe I misunderstood.

 Example - I buy a ZERO Coupon maturing 1/11/24, it works as you described. But if I buy a STRIP maturing in 2024, I’ll pay the interest in 2023 and then the rest for 2024 at maturity.
[/QUOTE]

STRIPS are zero-coupon bonds; i.e., the coupon rate is 0%. The term zero-coupon bond typically is referring to STRIPS, since non-STRIPS zero-coupon Treasuries are Treasury bills, not bonds or notes. At least that's the impression I've gotten in all of my reading.

FactualFran has presented a different interpretation of Pub 550, and the presentation is rational.

You must read pub 550, and perhaps even the relevant statutes, and decide for yourself, or your tax prep person can decide. I have seen a number of such decisions by CPAs that interpret the statutes in favor of the client. They know what is and is not likely to get audited.

When I ask ChatGPT 4.0 about it, I get this response:

[QUOTE]
While most U.S. Treasury bonds do pay semiannual coupons, there are a couple of types of U.S. Treasury securities that are essentially zero-coupon bonds:

1. **Treasury Bills (T-Bills)**: These are short-term securities with maturities ranging from a few days to 52 weeks. T-Bills are issued at a discount to face value and redeemed at face value. The difference between the purchase price and the face value represents the interest earned. For example, you might buy a $1,000 T-Bill for $980, then get $1,000 when it matures. The $20 difference is your interest.

2. **STRIPS (Separate Trading of Registered Interest and Principal of Securities)**: These are not issued directly to investors but are created by financial institutions. They're derived from Treasury notes or bonds, which do pay semiannual interest. However, the interest payments (each one is called a "coupon") and the principal payment at maturity can be separated, or "stripped," into individual securities. Each of these stripped components becomes a zero-coupon bond, which pays no interest until it matures. For example, a 10-year Treasury note has 20 semiannual coupon payments and one principal payment, all of which can be stripped to create 21 separate zero-coupon bonds.

STRIPS and T-Bills are attractive to investors who want a guaranteed return at a specific future date and don't need regular income from their investments. However, the tax treatment can be complicated, because even though you don't receive the interest until maturity, in some jurisdictions you may have to pay tax on the accrued interest each year.
[/QUOTE]

To be safe, a better approach might be the one recommending to buy low-coupon Treasuries selling at a deep discount. These clearly are "market discount bonds", and I believe the Pub 550 section I referred to would apply.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Doc wrote: Tue Jul 18, 2023 11:04 amCrisisAverted wrote: Tue Jul 18, 2023 2:23 am]
Doc wrote: Tue Jul 18, 2023 11:04 am
CrisisAverted wrote: Tue Jul 18, 2023 2:23 am
Is it possible to buy a treasury bill that's long dated but acts like a treasury bill to where there's no coupon or accrued interest to have to worry about but no need to worry about interest posting anytime soon?

There are long date Treasury BILLS. By definition a T-Bill has a maturity of 52 weeks or less.

That said there are zero coupon (stripped) Treasury notes and bonds. You can purchase these on the secondary market. There will be no coupon payments but you might have to pay tax on the accrued interest. I'll let the tax gurus opine on that aspect.
[/QUOTE]

Right. Zero-coupon bonds are "market discount bonds". Read about taxation of these bonds here: Market discount bonds--IRS Pub 550.

Bottom line is that you can elect to report accrued market discount as interest in each tax year it's accrued, or if you don't make the election, you report it as interest income in the tax year you dispose of it (sell it or it matures).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Mezzinmi wrote: Mon Jul 17, 2023 11:18 am]
Mezzinmi wrote: Mon Jul 17, 2023 11:18 am
Other than the liquidity advantage of T-bills over CDs, it seems there is little to gain--$34--from the marginal increased return of a t-bill in the following example over a CD for the assumed additional hassle of tax filing with T-bill interest income. What am I missing?
$100,000 CD @ 5.5% minus MI 4.25 % income tax rate: interest earned $ 5,266.25
$100,000 T-bill @ 5.3%, no state income tax: interest earned: $5,300
[/QUOTE]

What additional hassle? Reporting Tbill interest income on tax returns is simple.

Also, with a new issue CD, you have to wait for settlement, which can be quite a few days, and on the secondary market you pay a commission. You can buy Treasuries on secondary with no commissions or fees with settlement the next trading day. I am not even considering CDs these days, although I have been a huge CD proponent in the past when the yield premiums over Treasuries were more than 100 basis points.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Anitya wrote: Thu Jul 06, 2023 1:32 amKevin M wrote: Wed Jul 05, 2023 1:05 pm]
Anitya wrote: Thu Jul 06, 2023 1:32 am
Kevin M wrote: Wed Jul 05, 2023 1:05 pm

Wow, Anitya, that is so cool of you to share this. Quite a bit of sharing for being time constrained!

And welcome to the forum! What a wonderful and informative first post.

Thanks!

Kevin

Thank you.  Yes, I am new here.  I did modify my original post which probably was only half the size and the final version may still have spelling, missing words, and grammatical mistakes.  Apologies for any such transgressions.  Obviously, my attempt to address you by writing @Kevin M did not work.  What do I do to make it work?
[/QUOTE]

No need for apologies, as this is a forum, not something like a Wiki article that should be more polished. That's one of the reasons I stopped contributing to the Wiki--to much attention to detail required, not to mention too much negotiation about content and wording. I didn't notice anything at all lacking in your post. I make typos that sometimes spellcheck does not catch, and my old eyes don't catch either. No one has complained, and if I make a mistake worth noting, someone points it out, either in the forum or in a PM.

Speaking of which, if by "address you" you meant to PM me, you can do that by clicking on the little bubble with 3 dots in it below "Contact" under my username to the right of my posts. However, your post is very useful, and deserves to be in the forum. Most things that folks PM me would be better off in the forum, since others can learn from the dialog.

RE: the NC topic, if I were an NC resident, I would ignore the lower court ruling, as it conflicts with federal law, from what I understand, and I would follow my interpretation of federal law. 

But like you said, perhaps we've discussed that enough in this thread, since it only applies to a small subset of us. I see the July 2022 population estimate as 10.7M, which is about 3% of the US population.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Anitya wrote: Thu Jul 06, 2023 12:57 pm]
Anitya wrote: Thu Jul 06, 2023 12:57 pm
Cas,

"And having said all *that*, I seem to recall that Kevin has previously asked that we not derail this more general thread onto being cluttered up/bogged down discussing the North Carolina decision. There is another dedicated thread here where there is lots of detailed discussion already."

That thread has all sorts of discussions about Treasury bonds, not to mention the OP and thread title of that thread does not focus on the state income tax matters.  Is there a dedicated thread for state income tax consequences of market discount bonds?  If not, an administrator or a moderator of this forum perhaps can copy and paste the relevant posts from that thread into a new dedicated thread for "State income tax on Market Discount Bonds" - just a suggestion.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Anitya wrote: Tue Jul 04, 2023 10:15 pm]
Anitya wrote: Tue Jul 04, 2023 10:15 pm
@Kevin M,

I am in a time constraint and am sharing quickly what I learned.  

[/QUOTE]

Wow, Anitya, that is so cool of you to share this. Quite a bit of sharing for being time constrained!

And welcome to the forum! What a wonderful and informative first post.

Thanks!

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: zero_coupon wrote: Tue Jul 04, 2023 5:03 amKevin M wrote: Mon Jul 03, 2023 11:29 am]
zero_coupon wrote: Tue Jul 04, 2023 5:03 am
Many thanks for your reply.

Kevin M wrote: Mon Jul 03, 2023 11:29 am
The accrued interest that you pay the seller is reported in a supplementary section of the composite 1099 for the tax year in which the note was purchased.

If you are using tax software, you'll check the box that says an adjustment is needed for the 1099-INT on which the coupon interest is reported. Then you'll select "bought between interest payment dates", or something like that. You then enter the accrued interest paid to seller as a positive number. The software will enter this on Schedule B as a negative adjustment to interest. Some of us do this for the tax year the acc int is reported, and some do it in the tax year of the first coupon payment.

One may choose whether to make the accrued interest adjustment in (a) the year it's reported or (b) the year of the first coupon payment?
[/QUOTE]

Some interpret the wording in the IRS pubs to mean that one should deduct the accrued interest in the tax year of the first coupon. Others of us feel that this is a grey enough area that it's fine to deduct it from other interest at that brokerage, or perhaps if there is any other Treasury interest at all from any brokerage. If there is none, I make a note to deduct it in the following tax year.

Glad the replies were helpful to you.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: zero_coupon wrote: Fri Jun 30, 2023 6:20 pm]
zero_coupon wrote: Fri Jun 30, 2023 6:20 pm
Suppose one purchases a secondary treasury note that matures in late 2024, about 1.5 years from now.

I'd like to confirm my understanding of the tax reporting required (for 2023 AND 2024) upon purchasing this secondary Treasury now and holding it to maturity:

Unlike with an auction purchase, one must report "interest paid to seller," correct? How? As a subtraction from the upcoming 2023 coupon payments reportable on 2023 Schedule B? Is this amount specified on a 1099 from the broker? Anything else to report in 2023? Then, 2024 tax filing would be the same as if the note were purchased at auction? Just report coupon payments on Schedule B, similar to bank interest?

Thanks for your assistance.
[/QUOTE]

The accrued interest that you pay the seller is reported in a supplementary section of the composite 1099 for the tax year in which the note was purchased.

If you are using tax software, you'll check the box that says an adjustment is needed for the 1099-INT on which the coupon interest is reported. Then you'll select "bought between interest payment dates", or something like that. You then enter the accrued interest paid to seller as a positive number. The software will enter this on Schedule B as a negative adjustment to interest. Some of us do this for the tax year the acc int is reported, and some do it in the tax year of the first coupon payment.

If you also have market discount to report, you need to make that adjustment in a similar way. Depending on the software, you may be able to do this for the same 1099-INT form (TT I believe), or you may have to enter a dummy 1099-INT for either the accrued interest or market discount (HRB, for sure--at least for 2022 tax year, since that's what I've used in recent years). The OP discusses this some, so please read that. This is different than for notes bought at auction.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Bogle-007 wrote: Sat May 27, 2023 11:53 pmKevin M wrote: Thu May 25, 2023 1:40 pmBogle-007 wrote: Wed May 24, 2023 8:52 pm]
Bogle-007 wrote: Sat May 27, 2023 11:53 pm
Kevin M wrote: Thu May 25, 2023 1:40 pm
Bogle-007 wrote: Wed May 24, 2023 8:52 pm
Is it possible to have your brokerage, such as Fidelity, withhold federal taxes from the interest?

I don't think so, but you should just ask Fidelity.

Say you have a large amount of treasury interest income that will post in April and November of this year. If you want to pay estimated federal taxes, are you supposed to make the corresponding 1040ES payments in the 2nd and 4th quarters?
[/QUOTE]

Tax prep is simpler is you make quarterly payments in equal installments, or have it withheld from pay, SS, or RMD (best options). It's more complicated, but you can calculate any penalty by matching up income with estimated tax payments by quarter, in which case, paying in the quarter of the income, or before, is the way to go.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Doc wrote: Thu May 25, 2023 3:17 pm]
Doc wrote: Thu May 25, 2023 3:17 pm
I have a Treasury note maturing in a few weeks that was bought on the secondary market at a small premium over par and with accrued interest.

How do I record the maturing transaction for tax purposes?
[/QUOTE]

Hey Doc,

1. See the OP--it covers the basics.

2. Search this thread for "amortized bond premium". The very first hit provides the details on your choices and how to report it.

Bottom line, the ABP will be reported on the 1099-INT but you must deal with the accrued interest manually. With HRB, you can only do one or the other adjustment for a single 1099-INT, so I do the ABP adjustment for the original 1099-INT, then create a dummy 1099-INT to do the accrued interest adjustment. I vaguely recall that others have reported that TT lets you do both adjustments on the original 1099-INT--u probably can find that too if you search the thread.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: exodusing wrote: Thu May 25, 2023 5:09 pmKevin M wrote: Thu May 25, 2023 1:43 pmexodusing wrote: Thu May 25, 2023 11:40 am]
exodusing wrote: Thu May 25, 2023 5:09 pm
Kevin M wrote: Thu May 25, 2023 1:43 pm
exodusing wrote: Thu May 25, 2023 11:40 am
I'm considering purchasing some TIPS in taxable and want to make sure I understand.  They would be purchased at Vanguard and I use TurboTax.

If I'm reading correctly, Vanguard's 1099 (actual or important) does most the work, but you have to track and adjust for accrued interest.

Cash income, inflation adjustment and any OID are taxable at ordinary rates for federal tax and are exempt from state taxation.

Pretty much correct. The inflation adjustment is reported as OID, so these are one and the same.

The only accrued interest to deal with is what you pay when you buy, and you just deal with that either in the tax year you buy (which I do if possible), or in the tax year you receive your first coupon payment.

Thank you.

#cruncher, you and others have said TIPS are best in an IRA or other tax-advantaged account, since the tax reporting is simpler.  The reporting may be simpler in that case, but the above does not sound at all complicated, at least for someone like me who buys on the secondary market and intends to hold to maturity. Am I misinterpreting?

Here's a #cruncher post on tax reporting for TIPS in taxable: viewtopic.php?p=1849197#p1849197  I believe we've covered the issues he mentions (other than regarding sales, which is obviously not relevant if holding to maturity). Posters in the thread he links suggest reporting is easy, e.g., viewtopic.php?p=2683617#p2683617
[/QUOTE]

Not checking the post, but IIRC, his issue was regarding incorrect OID reporting by the broker, so needing to calculate it yourself. As I have shared, Vanguard's OID reporting was accurate, and I have no reason to think Fidelity's would not be. Perhaps brokers have gotten better at this since #Cruncher's experience?

I found the tax prep with HRB to be quite straightforward.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: exodusing wrote: Thu May 25, 2023 11:40 am]
exodusing wrote: Thu May 25, 2023 11:40 am
I'm considering purchasing some TIPS in taxable and want to make sure I understand.  They would be purchased at Vanguard and I use TurboTax.

If I'm reading correctly, Vanguard's 1099 (actual or important) does most the work, but you have to track and adjust for accrued interest.

Cash income, inflation adjustment and any OID are taxable at ordinary rates for federal tax and are exempt from state taxation.
[/QUOTE]

Pretty much correct. The inflation adjustment is reported as OID, so these are one and the same.

The only accrued interest to deal with is what you pay when you buy, and you just deal with that either in the tax year you buy (which I do if possible), or in the tax year you receive your first coupon payment.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Bogle-007 wrote: Wed May 24, 2023 8:52 pm]
Bogle-007 wrote: Wed May 24, 2023 8:52 pm
Is it possible to have your brokerage, such as Fidelity, withhold federal taxes from the interest?
[/QUOTE]

I don't think so, but you should just ask Fidelity.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Thu May 25, 2023 1:26 pmkalarama wrote: Thu May 25, 2023 12:39 pm]
FactualFran wrote: Thu May 25, 2023 1:26 pm
kalarama wrote: Thu May 25, 2023 12:39 pm
For the notes, I am trying to understand taxation between 2023 and 2024. For the coupons, there will be at least 1 more coupon in 2023 which will be taxable in 2023 (adjusted for accrued interest paid at purchase) and one final coupon taxed in 2024. If I hold the note to maturity in 2024, will the rest of the ‘gain’ be taxed in 2024?  Or will some of that be taxable in 2023?  Reading this thread, it is not clear to me.  If it's easier, I can provide a specific example to run through using actual numbers for a specific purchase on Fidelity.

There could be income tax for 2023 on other than interest payments in 2023 of a Treasury Note purchased in 2023 that matures in 2024.  It depends on the actual numbers and which of the various income tax options the brokerage is using, either by default or because of a choice that you made.  It would be easier if you provided specific values for the settlement date, maturity date, and purchase price per $100 par.
[/QUOTE]

In my experience, the default at Fidelity is to report accrued market discount on 1099-B in column f at maturity (from memory, I'm not going to research this again, as I've done it many times in this thread--you can search to find more). Unless you have elected to pay tax on accrued market discount each year, the tax will be at maturity.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: CrisisAverted wrote: Sun May 21, 2023 1:39 amKevin M wrote: Sat May 20, 2023 3:04 pm]
CrisisAverted wrote: Sun May 21, 2023 1:39 am
Kevin M wrote: Sat May 20, 2023 3:04 pm

My answers.

1. No. The issue date does not matter. The tax reporting is no more complicated if the bill matures in the year of purchase or the year after purchase. The longest maturity bill is 52 weeks, which is 364 days, so all bills have a maturity of less than one year.

2. CrisisAverted answer is correct.

3. CrisisAverted answer is correct.

4. Accrued interest only applies to Treasuries that pay coupon interest. Bills don't have coupon payments--all interest is in the form of accrued acquisition discount (which is the correct term for bills).

Kevin

Thanks, this is very reassuring!

To confirm, is "accrued acquisition discount" handled any different than just a simple entry in the 1099-INT?
[/QUOTE]

Only if you sell before maturity, in which case everything is shown in a supplemental section of the composite 1099. In that case, there is extra work, which has been discussed previously (multiple times I think).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MisterMister wrote: Sat May 20, 2023 10:01 amCrisisAverted wrote: Sat May 20, 2023 2:26 am]
MisterMister wrote: Sat May 20, 2023 10:01 am
CrisisAverted wrote: Sat May 20, 2023 2:26 am
Holy cow, this thread has made my head spin. 

Like many, I have purchased treasuries for the first time in 2023 (Calif). 

I have only purchased zero coupon tbills on the secondary market. All of them so far have been issued within 2023 with maturity dates in 2023. All were purchased at a "discount" (not sure if this is the right terminology) with the par value credited to me at maturity. 

I am intending on holding all the bills to maturity. 

I did buy CUSIP 912796W47 (UNITED STATES TREAS BILLS ZERO CPN) with an issuance date of 5/19/22 and a maturity of 5/18/23. I purchased this one probably sometime in February 2023. 

I have read through the thread that tax handling seems to be simpler if the maturity of the tbill is less than a year. Although, definitionally, shouldn't they all mature less than a year if it's marked as a tbill? 

Questions: 

1. Will 912796W47 complicate taxes in any way because it issued on 5/19/22 with maturity on 5/18/23? That's still less than a year, correct? 
2. What should I be expecting for my 2023 taxes in terms of tax forms? I would expect some sort 1099-INT with a breakdown of interest earned from treasuries and a separate calculation for interest from not treasuries? 
3. Will tax software automatically figure out not to charge me CA state taxes for the interest earned from treasuries? 
4. Do I need to worry about the "accrued interest" issue that pages of this thread have been discussing?

Yes all t-bills are short-term securities for tax purposes.
1. No and yes.
2. 1099-INT box 3 will include your t-bills, and income in this box is exempt from state/local taxes.  You don't mention your broker but Fidelity has supplemental information which shows the details.
3. Yes (see 2)
4. No; there no accrued interest for t-bills because they pay no interest.
[/QUOTE]

My answers.

1. No. The issue date does not matter. The tax reporting is no more complicated if the bill matures in the year of purchase or the year after purchase. The longest maturity bill is 52 weeks, which is 364 days, so all bills have a maturity of less than one year.

2. CrisisAverted answer is correct.

3. CrisisAverted answer is correct.

4. Accrued interest only applies to Treasuries that pay coupon interest. Bills don't have coupon payments--all interest is in the form of accrued acquisition discount (which is the correct term for bills).

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Artsdoctor wrote: Thu May 18, 2023 5:39 pmMisterMister wrote: Wed May 17, 2023 8:50 pmerp wrote: Wed May 17, 2023 6:11 pmMisterMister wrote: Mon May 01, 2023 1:48 pmerp wrote: Sun Apr 30, 2023 11:17 pm]
Artsdoctor wrote: Thu May 18, 2023 5:39 pm
MisterMister wrote: Wed May 17, 2023 8:50 pm
erp wrote: Wed May 17, 2023 6:11 pm
MisterMister wrote: Mon May 01, 2023 1:48 pm
erp wrote: Sun Apr 30, 2023 11:17 pm

Wasn't this just discussed??  Looks like it starts around here viewtopic.php?p=7179076#p7179076
.
.
.

I think the discussion you reference was about T-bills specifically, which are handled differently than notes.

I think that tbills and tnotes are probably handled the same.  However, one uses the term "accrued market discount" and the other "accrued acquisition discount".  The other difference that I gathered from Kevin's posts, is that the 1099B shows the tnote sales, but does not show the tbill sales - and just puts the info in the details section for you to figure out.  I agree this seems ambiguous, almost like the broker isn't sure how it is handled.  imo the worksheet posted before from the 8949 instructions would work for all cases, if you had the raw numbers.  https://www.irs.gov/instructions/i8949# ... 1000114436

That's where there was also some confusion since in a different post Kevin mentioned that Schwab and Fidelity report the basis differently - in one case adjusting for the accrued market discount and the other not.  That would throw off the worksheet, although the worksheet instructions do point out that the basis might be incorrectly reported on the 1099B and to fix that before entering it into the worksheet.

People have pointed out a variety of idiosyncracies related to how brokers handle reporting, that's true.

More basically, though, the differences in interest and capital gains reporting were highlighted by the most recent posts.  

T-bills pay no interest, but some or all of any gains are handled as interest.  Many here (including me) were uncertain how to determine what portion of such gains are interest and what portion are capital gains in various cases. 

There is no such uncertainty with notes.  They do pay interest, and the amounts of the interest you receive (or pay if you buy on the secondary market), are determined through clearly defined mathematical rules.

This is what I meant when I said t-bills are handled differently.  Handling of income from short-term securities (1 year or less, which includes all t-bills) is described in specific sections of publication 550 (though evidently not very well).

Not to throw sand into the gears, but I suspect that even notes will create similar headaches for some.  Because of the relatively high interest rates, there are plenty of notes out there maturing in a couple of years with coupons of 0.125% and 0.250% so they're deeply discounted.  The interest from coupons is nearly insignificant but the majority of the income will be from the discount.  If those notes are held until maturity, there will no hand-wringing with taxation--but if they're sold before maturity, I can see where there might be some confusion.  Although I'd really like to think that the broker will handle income and gains/losses correctly, I'm left with a little uncertainty after going through this thread.
[/QUOTE]

On my 2019 1099-B from Schwab, the accrued market discount for notes sold before maturity was reported in column 1f, as has been discussed. The gain was shown as proceeds minus cost minus acc mkt disc.

For bills, the accrued acquisition discount is not reported anywhere. I had to figure it out myself.

So, note taxation was definitely easier to deal with if sold before maturity.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Echard wrote: Tue May 16, 2023 12:38 pmKevin M wrote: Mon May 15, 2023 10:29 pmEchard wrote: Mon May 15, 2023 6:15 pm]
Echard wrote: Tue May 16, 2023 12:38 pm
Kevin M wrote: Mon May 15, 2023 10:29 pm
Echard wrote: Mon May 15, 2023 6:15 pm

Will a brokerage 1099 form automatically figure out what's capital gain vs interest? Or, does the investor have to somehow do their own calculations and report something that is different from what's on the 1099. I've got to believe in this day and age, with such complexity in the tax code for bonds, they calculate it correctly? It does seem to be a very minimal tax impact, because .0025 percent times say 8 years for a bond with 8 years to maturity is only 2%.

This has already been covered multiple times in this thread. I bet you could find it with a search. It's different for bills and notes/bonds. Since we're discussing bills (I think), my 2019 1099 showed the "gains" for the bills in a supplemental section, not reported to the IRS. I had to do my own calculations to determine what was interest and what was STCG gain.

This was with Schwab.

Ya, sorry, I"ve been asking questions about corporate bonds in the treasury bill/note/bond thread, causing confusion. There wasn't a tax related thread for corporate bonds.
[/QUOTE]

Sorry, somehow I thought we were discussing Treasury bills. I think much of what you learn in this thread should apply, but you really need to study Pub 550 and related Pubs, and I think you're getting that guidance here.

You could start a new thread for taxation of corporate bonds, but I'm pretty sure that there are many more Bogleheads who buy individual Treasuries than there are that buy individual corporates or munis.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Echard wrote: Mon May 15, 2023 6:15 pm]
Echard wrote: Mon May 15, 2023 6:15 pm

Will a brokerage 1099 form automatically figure out what's capital gain vs interest? Or, does the investor have to somehow do their own calculations and report something that is different from what's on the 1099. I've got to believe in this day and age, with such complexity in the tax code for bonds, they calculate it correctly? It does seem to be a very minimal tax impact, because .0025 percent times say 8 years for a bond with 8 years to maturity is only 2%.
[/QUOTE]

This has already been covered multiple times in this thread. I bet you could find it with a search. It's different for bills and notes/bonds. Since we're discussing bills (I think), my 2019 1099 showed the "gains" for the bills in a supplemental section, not reported to the IRS. I had to do my own calculations to determine what was interest and what was STCG gain.

This was with Schwab.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ofckrupke wrote: Mon May 15, 2023 1:08 pm#Cruncher wrote: Mon May 15, 2023 7:29 am]
ofckrupke wrote: Mon May 15, 2023 1:08 pm
#Cruncher wrote: Mon May 15, 2023 7:29 am
Here is how I think this rule is intended to be implemented. For illustration I'm using the 26-week and 52-week bills issued 2/23/2023 and sold today in the secondary market at made-up prices. [*] Someone please correct me if this is not the right way.

My problem with your treatment is that it contradicts the text of IRS Publication 550 (underlining by me):

Discounted Debt Instruments

Treat your gain or loss on the sale, redemption, or retirement of a bond or other debt instrument originally issued at a discount or bought at a discount as capital gain or loss, except as explained in the following discussions.

Short-term government obligations. Treat gains on short-term federal, state, or local government obligations (other than tax-exempt obligations) as ordinary income up to your ratable share of the acquisition discount. This treatment applies to obligations with a fixed maturity date of not more than 1 year from the date of issue. Acquisition discount is the stated redemption price at maturity minus your basis in the obligation.    [...]

So - at least for treasury bills - if the sale is at outright loss then the discussed exception (treating gain up to ratable share of acquisition discount as interest) doesn't apply.  It's just a capital loss and there's no reportable interest.

My treatment, for t-bills, is as yours except for the last two lines, which I replace by three as follows.  [besides its compliance with pub 550, in this treatment each portion of realized gain/loss (treasury interest and  capital gain/loss) is well-behaved  (continuous, anyway) at the two boundaries (realized gain = 0, realized gain = ratable share of acquisition discount).]

Code: Select all 
12      Ratable Share of Discount       =B10*B9
13      ST capital gain/loss            =MIN(0,B11)+MAX(0,B11-B12)
14      Taxable Treasury Interest       =B11-B13
[/QUOTE]

Interesting. I hadn't thought about the loss case. Last time I sold bills on secondary was in 2019. Reviewing my 1099, I see that all sales had gains (yipee!), so I never had to deal with the loss case.

I did basically what #Cruncher indicated, with which you agree.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bluerafters wrote: Sun May 14, 2023 2:36 pmKevin M wrote: Sun May 14, 2023 1:02 pmbluerafters wrote: Sun May 14, 2023 5:51 am]
bluerafters wrote: Sun May 14, 2023 2:36 pm
Kevin M wrote: Sun May 14, 2023 1:02 pm
bluerafters wrote: Sun May 14, 2023 5:51 am
What happens in taxes if you simplify all of this and buy and hold something like SGOV?

You will receive your interest as dividends, as with any mutual fund or ETF. Income will be reported on 1099-DIV.

In HR Block tax software, for the 1099-DIV entry, I check the box "From U.S. Treasury Obligations, then on the next screen I enter the percent USGO (which should be 100% or close to it for a Treasury-only fund, like SGOV. This ensures the correct state income tax exemption.

Appreciate the reply. I use FreeTax so I'll have to make sure I investigate the appropriate avenue so I capture the exemption. Otherwise, what's the point?
[/QUOTE]

Just downloaded SGOV holdings as of May 12. There is 9.59% in a MM fund, which may not count as USGO. But, there also is -11.15% in "USD Cash", and I don't know if that offsets the MM holding or not. The percent USGO should be available somewhere for 2023 taxes.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: bluerafters wrote: Sun May 14, 2023 5:51 am]
bluerafters wrote: Sun May 14, 2023 5:51 am
What happens in taxes if you simplify all of this and buy and hold something like SGOV?
[/QUOTE]

You will receive your interest as dividends, as with any mutual fund or ETF. Income will be reported on 1099-DIV.

In HR Block tax software, for the 1099-DIV entry, I check the box "From U.S. Treasury Obligations, then on the next screen I enter the percent USGO (which should be 100% or close to it for a Treasury-only fund, like SGOV. This ensures the correct state income tax exemption.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: GaryA505 wrote: Thu May 04, 2023 10:00 amstudent wrote: Thu May 04, 2023 8:25 amGaryA505 wrote: Thu May 04, 2023 8:08 am]
GaryA505 wrote: Thu May 04, 2023 10:00 am
student wrote: Thu May 04, 2023 8:25 am
GaryA505 wrote: Thu May 04, 2023 8:08 am
So for bills it's not an issue at all? I suppose because they're zeros and the gain is in the higher value at maturity.

That's my understanding after reading most of the thread and I followed this in my tax return for last year.

The reason I asked about this is that I have some money in a ST muni fund, but the tax-exempt income this year from that will put me dangerously close to the first IRMAA cliff. Moving this from muni fund to t-bills would push this income into next year, when my tax situation will be much better. Of course the t-bill earnings will be taxable next year, but that's OK with me.
[/QUOTE]

That works, and the tax reporting will be easy if you hold to maturity.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: vaylie wrote: Thu May 04, 2023 12:38 amGaryA505 wrote: Thu May 04, 2023 12:24 am]
vaylie wrote: Thu May 04, 2023 12:38 am
GaryA505 wrote: Thu May 04, 2023 12:24 am
I've seen mentions extra work for tax preparation for treasures bought on the secondary market, in a taxable account. Something about accrued interest? Can anyone explain?  Is this only for notes and bonds, or are there tax complication issues with bills bought on the secondary market as well?

Not an issue for bills, but when I bought notes on the secondary market last year, they showed up on my 1099-B, and I had to add the accrued market discount to my total interest in Schedule B. FreeTaxUSA did this for me automatically but OLT (which I use to double check things) did *not*, so that's something to keep an eye out for.
[/QUOTE]

Accrued interest and accrued market discount are two different things, and neither one applies to bills.

Accrued interest is what you pay the seller, and you deduct that from your interest. Accrued market discount is interest income for notes and bonds, and this is reported as a reduction to cap gain on 1099B; you then add an entry for it in Schedule B as interest.

Bills have "accrued acquisition discount", which is reported as USGO interest if you hold to maturity. If you sell before maturity, it's a bit more complicated, as has been discussed.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kevin M wrote: Mon May 01, 2023 1:00 pmerp wrote: Sun Apr 30, 2023 11:17 pmKevin M wrote: Sun Apr 30, 2023 2:08 pm]
Kevin M wrote: Mon May 01, 2023 1:00 pm
erp wrote: Sun Apr 30, 2023 11:17 pm
Kevin M wrote: Sun Apr 30, 2023 2:08 pm
Simplified example. Say you buy a 10-year bond at 90, which is a market discount of 10. Unless you elect to include accrued market discount in current income, about 1 of that discount will be accrued after one year. If you sell the bond after one year at 92, you have accrued discount of 1 and capital gain of 1. If you sell it at 90 you have accrued discount of 1 and capital loss of 1.

Wasn't this just discussed??  Looks like it starts around here viewtopic.php?p=7179076#p7179076

You might have dropped out of that conversation.  Not sure if that means you agreed or didn't agree with it.

Here's the IRS worksheet showing that there would NOT be accrued discount + offsetting cap loss for the underlined case.  "Worksheet for Accrued Market Discount Adjustment in Column (g)"
https://www.irs.gov/instructions/i8949# ... 1000114436

Did we get something wrong?

Basis is increased by the amount of accrued market discount. Using the form's instructions:

1. Proceeds = 90.
2. Basis = 91 (90 plus AMD)
3. #2 minus #1 = -1.
4. AMD = 1
5. Smaller of #3 or #4 = -1. This is entered as the adjustment in column g of 8949.

proceeds minus basis = 92 - 91 = 1 (cap gain before adjustment)

Gain or loss equals proceeds minus basis adjusted by column g (-1) = 1 - 1 = 0.

Kevin
[/QUOTE]

I sold lots of Treasuries before maturity in 2019. Looking at my 2019 return, I may be wrong about the above. I did not use the worksheet for AMD because Schwab reported the AMD on the 1099-B. Here are the numbers that would appear on the 1099-B:

1d proceeds = 90

1e basis = 90

1f amd = 1

Realized gain loss = 90 - 90 - 1 = -1.

So a loss of -1 is on 8949, but the AMD must be entered as interest on Schedule B (I used a dummy 1099-INT), so the interest of 1 offsets the loss of -1, and the net is 0. Same result, but different way of reporting it.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: erp wrote: Sun Apr 30, 2023 11:17 pmKevin M wrote: Sun Apr 30, 2023 2:08 pm]
erp wrote: Sun Apr 30, 2023 11:17 pm
Kevin M wrote: Sun Apr 30, 2023 2:08 pm
Simplified example. Say you buy a 10-year bond at 90, which is a market discount of 10. Unless you elect to include accrued market discount in current income, about 1 of that discount will be accrued after one year. If you sell the bond after one year at 92, you have accrued discount of 1 and capital gain of 1. If you sell it at 90 you have accrued discount of 1 and capital loss of 1.

Wasn't this just discussed??  Looks like it starts around here viewtopic.php?p=7179076#p7179076

You might have dropped out of that conversation.  Not sure if that means you agreed or didn't agree with it.

Here's the IRS worksheet showing that there would NOT be accrued discount + offsetting cap loss for the underlined case.  "Worksheet for Accrued Market Discount Adjustment in Column (g)"
https://www.irs.gov/instructions/i8949# ... 1000114436

Did we get something wrong?
[/QUOTE]

Basis is increased by the amount of accrued market discount. Using the form's instructions:

1. Proceeds = 90.

2. Basis = 91 (90 plus AMD)

3. #2 minus #1 = -1.

4. AMD = 1

5. Smaller of #3 or #4 = -1. This is entered as the adjustment in column g of 8949.

proceeds minus basis = 92 - 91 = 1 (cap gain before adjustment)

Gain or loss equals proceeds minus basis adjusted by column g (-1) = 1 - 1 = 0.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Echard wrote: Sun Apr 30, 2023 7:18 amKevin M wrote: Fri Apr 28, 2023 12:19 pm]
Echard wrote: Sun Apr 30, 2023 7:18 am
Kevin M wrote: Fri Apr 28, 2023 12:19 pm6. Treasury calculations - Do they have the same calculations as described above?

You mean Treasuries as opposed to non-Treasury bonds? This entire thread is about taxation of Treasuries, so everything here relates to Treasuries.

It sounds like you are wondering about 2023 taxes, right? Maybe better to revisit this when you receive your 2023 composite 1099, so we can review your specific issues.

Kevin

[ quote fixed by admin LadyGeek]

Since I couldn't find a thread covering taxation of other types of bonds, like corporate bonds, I was hoping that the rules might be the same/similar. If I look just at buying a corporate bond at a discount in the secondary market and holding to maturity, the coupon payments are obviously 1099-INT, but I've received conflicting information on whether the gains on the appreciation to par value are taxed as capital gains or interest. Can anyone clarify? It seems from Publication 550 it is ordinary income. But I've seen many people online talk about capital gains on their bonds, which I don't get. Obviously, if you sold before maturity and realized a gain above and beyond the par value, then that portion is capital gains.
[/QUOTE]

Many people propagate incorrect information online. Accrued market discount is taxed as interest for any type of bond.

If you sell before maturity there will be some accrued market discount, and probably some capital gain or loss. It doesn't matter if it's above or below par when you sell.

Simplified example. Say you buy a 10-year bond at 90, which is a market discount of 10. Unless you elect to include accrued market discount in current income, about 1 of that discount will be accrued after one year. If you sell the bond after one year at 92, you have accrued discount of 1 and capital gain of 1. If you sell it at 90 you have accrued discount of 1 and capital loss of 1.

If you hold until the bond matures at 100, you will pay tax on the accrued market discount of 10 in the year of maturity (unless you have elected the current income option), and there is not capital gain or loss.

I am just another person online, but you seem to understand what Pub 550 says, and the IRS pubs are mostly what I use to help me understand this stuff. If anything I say here is incorrect, I expect that someone will correct me and provide references for the correct information.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Echard wrote: Fri Apr 28, 2023 7:57 am]
Echard wrote: Fri Apr 28, 2023 7:57 am
Hi, I am following up on an earlier post I made regarding the taxation of treasury bills, notes, and bonds. I read and re-read every answer, and now I am even more confused. Perhaps I could list out my confusion with a list of specific questions.  Really appreciate the help. I've been googling this for days, and even tried chatgpt, and I'm getting back conflicting information.  Here are the questions:

1. General taxation of any type of bond bought in the secondary market - If I buy any type of bond at a significant discount to the redeemable par value, and hold to maturity, it is my understanding it is taxed at ordinary income rates. I've read many people online who seems to believe the coupon payments are taxed at income rates, and the delta gain between discount and par is at capital gains rates. This is incorrect, right?
[/QUOTE]

Yes, as explained by petulant.

[QUOTE]
2. Vanguard reporting - When Vanguard reports this, they will provide the correct 1099-INT that address both coupon interest and gain interest, right?
[/QUOTE]

The term "gain interest" is not used. Vanguard reports coupon payments as interest on 1099-INT. Please re-read the OP to see how accrued market discount is reported (unless you elect to included it in current income).

If it's a bill, the term used is "acquisition discount", and this is reported as interest on 1099-INT.

[QUOTE]
3. OID and accrued interest - I don't have to use either of these because it was held to maturity and the Vanguard 1099-INT has already done the calculations, right?
[/QUOTE]

1099-OID is used to report TIPS inflation adjustment income. Unless you buy STRIPS or TIPS, you probably won't receive a 1099-OID.

Accrued interest is what you pay to the seller if you buy a note or bond between coupon payments. This is reported in the year of purchase in a supplementary section of the composite 1099, so you either deduct it for the tax year of purchase, or you deduct it the following year. This is entered as an adjustment to the 1099-INT, so this is a manual step.

[QUOTE]
4. Sold in the secondary market before maturity - If I sold it before maturity in the secondary market, I do have to use OID and accrued interest to calculate how much of the gains or losses are income vs capital gains, right?
[/QUOTE]

Wrong terms, but basically yes. Since you are not selling before maturity, don't worry about this now.

[QUOTE]
5. Location of OID and Accrued Interest - If there was an OID on the bond originally, and accrued interest when I bought it, where would I find this information? I can't seem to locate it on Vanguard.
[/QUOTE]

Probably no OID to worry about. Accrued interest already discussed above.

[QUOTE]
6. Information for accountant - If OID and accrued interest information is required for the accountant, does everyone just send them a spreadsheet of these figures for each bond sold? Or, does the accountant get that information somehow from the 1099 form from Vanguard?
[/QUOTE]
Everything required is on the 1099 if you hold to maturity. If you sell before maturity, either you or your tax preparer may need to calculate the part that is accrued market/acquisition discount, and what part is capital gain.

[QUOTE]
6. Treasury calculations - Do they have the same calculations as described above?
[/QUOTE]

You mean Treasuries as opposed to non-Treasury bonds? This entire thread is about taxation of Treasuries, so everything here relates to Treasuries.

It sounds like you are wondering about 2023 taxes, right? Maybe better to revisit this when you receive your 2023 composite 1099, so we can review your specific issues.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Sun Apr 16, 2023 2:49 pmtalzara wrote: Sun Apr 16, 2023 1:36 pm]
SlowMovingInvestor wrote: Sun Apr 16, 2023 2:49 pm
talzara wrote: Sun Apr 16, 2023 1:36 pm

TurboTax allows more than one adjustment per 1099-INT.  H&R Block allows only one, so you have to split the 1099-INT if you need to enter more than one adjustment.

Different tax software has different limitations.  TurboTax has a similar limitation for form 1116 that you have to work around by splitting the 1099-DIV: viewtopic.php?t=401905

That was the question I had -- is the one adjustment per 1099-INT a limitation of HRB software or a representation of an underlying tax rule (which would make it applicable for all tax software). It seems it's a limitation of HRB software only. 

Thanks for the answer!
[/QUOTE]

You still need to be careful if there are different types of income included in the 1099-INT, e.g., Treasury, muni and fully taxable. Even with TT, you may need to use multiple 1099-INTs to make sure the AC and ABP are applied to the right type of income. For just Treasuries in the 1099-INT, it's great that TT lets you do more than one type of adjustment per 1099.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Sat Apr 15, 2023 3:18 pmKevin M wrote: Sat Apr 15, 2023 1:32 pmSlowMovingInvestor wrote: Fri Apr 14, 2023 3:01 pmKevin M wrote: Wed Mar 29, 2023 3:20 pm]
SlowMovingInvestor wrote: Sat Apr 15, 2023 3:18 pm
Kevin M wrote: Sat Apr 15, 2023 1:32 pm
SlowMovingInvestor wrote: Fri Apr 14, 2023 3:01 pm
Kevin M wrote: Wed Mar 29, 2023 3:20 pm
^Brokers report accrued interest paid in the consolidated 1099 for the year in which the interest is paid. Some of us, including me, just subtract it all in the year reported if there is enough interest income from that broker to offset it. If not, I make a note to subtract the rest the next year.

In my case, Fidelity reported accrued interest of around $200 in 1099 supplemental (across all Treasury purchases).  My total Treasury Interest > $200. 

So all I have to do is to add an entry of -$200 for accrued interest in my Scheduile B?   

[There is also an ABP adjustment, but TurboTax automatically entered that when I downloaded my 1099-B from Fido. ]

If so, Fidelity made it a pretty simple for me!

I use HRB, but TT should be similar. Or, maybe TT handles it better--it's been years since I've used TT.

Near the bottom of the 1099-INT entry form in HRB, there's a box that says "Interest item requires an adjustment", which I check. On the next screen, I can select either "bought or sold this bond between interest payments", or, "The premium on this bond can be amortized". I can only check one.

If I select the former, I enter my accrued interest paid (positive number), and HRB enters this as a subtraction on Schedule B.

If I have both ABP and AC, I must only enter the adjustment for one in the "real" 1099-INT, then create a dummy 1099-INT to do the other adjustment. I do the ABP adjustment in the original, but reduce the interest amount by the AC. Then in a 1099-INT I enter that amount of interest, then do the AC adjustment for that amount.

Since your AC equals your interest, I don't know if this exact approach will work for you. You might have to carry forward part of the AC to next year (I did that on one return, since the interest was less than the AC.

Kevin

Thanks for the reply. I think my use of symbols was confusing. I used  > to indicate my interest was greater than AC  . That makes life simpler. 

About the dummy entry you created, is that a limitation of HRB itself in that it lets you pick just one of either ABP or AC ? I 

In TT at least, TT downloaded ABP adjustment automatically from Fidelity. I entered accrued interest manually  (just as you did for HRB) for the same 1099-INT.
[/QUOTE]

The bond premium is included in the downloaded 1099-INT, but I still have to do the adjustment. Just because it's in the 1099-INT, don't assume the adjustment is done. Make sure you see it in the forms somewhere.

So, the ABP is done by simply entering the bond premium from the 1099-INT in the adjustment screen, but you do have to enter it manually. Since I can only choose ABP or AC as the adjustment, I must use two 1099s if both ABP and AC adjustments are required.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: SlowMovingInvestor wrote: Fri Apr 14, 2023 3:01 pmKevin M wrote: Wed Mar 29, 2023 3:20 pm]
SlowMovingInvestor wrote: Fri Apr 14, 2023 3:01 pm
Kevin M wrote: Wed Mar 29, 2023 3:20 pm
^Brokers report accrued interest paid in the consolidated 1099 for the year in which the interest is paid. Some of us, including me, just subtract it all in the year reported if there is enough interest income from that broker to offset it. If not, I make a note to subtract the rest the next year.

In my case, Fidelity reported accrued interest of around $200 in 1099 supplemental (across all Treasury purchases).  My total Treasury Interest > $200. 

So all I have to do is to add an entry of -$200 for accrued interest in my Scheduile B?   

[There is also an ABP adjustment, but TurboTax automatically entered that when I downloaded my 1099-B from Fido. ]

If so, Fidelity made it a pretty simple for me!
[/QUOTE]

I use HRB, but TT should be similar. Or, maybe TT handles it better--it's been years since I've used TT.

Near the bottom of the 1099-INT entry form in HRB, there's a box that says "Interest item requires an adjustment", which I check. On the next screen, I can select either "bought or sold this bond between interest payments", or, "The premium on this bond can be amortized". I can only check one.

If I select the former, I enter my accrued interest paid (positive number), and HRB enters this as a subtraction on Schedule B.

If I have both ABP and AC, I must only enter the adjustment for one in the "real" 1099-INT, then create a dummy 1099-INT to do the other adjustment. I do the ABP adjustment in the original, but reduce the interest amount by the AC. Then in a 1099-INT I enter that amount of interest, then do the AC adjustment for that amount.

Since your AC equals your interest, I don't know if this exact approach will work for you. You might have to carry forward part of the AC to next year (I did that on one return, since the interest was less than the AC.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			^Brokers report accrued interest paid in the consolidated 1099 for the year in which the interest is paid. Some of us, including me, just subtract it all in the year reported if there is enough interest income from that broker to offset it. If not, I make a note to subtract the rest the next year.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=150

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Echard wrote: Wed Mar 29, 2023 2:00 pm]
Echard wrote: Wed Mar 29, 2023 2:00 pm
I was referred to this thread during a discussion of selling Treasuries before maturity. I now am on the verge of hopping off of a cliff. I just finally got over the horrific experience of trying to figure out tax losses and gains for a crypto NFT purchase transaction and am in no mood for any further IRS BS.

I read the first few pages of this thread and became frightened. I climbed out from under the bed to ask the guru's here a question. I've been buying Treasuries with maturities under two years in the secondary market in Vanguard and Fidelity. So far, I've held them all to maturity. Is my 1099 fully correct and will my accountant properly input everything into his tax software? Do I need to do anything?

Second, IF I wanted to sell Treasuries now for ones that would normally mature in a few months, am I creating a tax calculation hell for myself and my accountant? Appreciate any thoughts you might have.
[/QUOTE]

Your 1099s should be correct. I can't comment on the abilities of your accountant.

I did eight tax returns this year, most of which included Treasuries, and I didn't find the tax reporting difficult. No one sold before maturity, but I sold a bunch of Treasuries before maturity in 2019 at Schwab, and have discussed that in this thread; you probably can find it by searching the thread.

If you want to share the specifics of your 1099s (without disclosing account numbers or other personal info), we can comment in more detail.

If you sell before maturity, there can be some additional complications, but nothing that I would describe as "tax calculation hell". If your accountant is competent, they should be able to do it pretty easily.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Estimated Taxes and Original Issue Discount (OID)TIPS Taxable
			
[QUOTE: hudson wrote: Sun Mar 26, 2023 12:27 pmKevin M wrote: Sun Mar 26, 2023 11:44 amhudson wrote: Sun Mar 26, 2023 10:15 am]
hudson wrote: Sun Mar 26, 2023 12:27 pm
Kevin M wrote: Sun Mar 26, 2023 11:44 am
hudson wrote: Sun Mar 26, 2023 10:15 am
How does one figure out the OID for quarterly estimated taxes in a taxable account.

I might use withholding from a Required Minimum Distribution (RMD) account instead of quarterly tax payments.

Does your situation warrant using the safe harbor of paying 100% or 110% of previous years tax liability? This is what I do unless I have unusually high income in the previous year, in which case I want to pay less than what I paid last year.

I use withholding from my RMD to pay my tax in most years, the advantage being that it's much simpler, and you can do it any time and not get dinged for withholding enough earlier in the year (I usually take my RMD toward the end of the year).

Kevin

Thanks Kevin!
So safe harbor means paying 110% of Total Tax...line 24 on Form 1040-SR (2022).  I can do that; I think.
I usually run an estimated return in mid-November and do RMD withholding on Dec. 15th.

For 2022,I owed a few thousand more than I calculated in November...probably because of the OID from owning TIPS in taxable.  My estimated penalty was minimal. 

Safe Harbor in the Wiki: https://www.bogleheads.org/wiki/Estimat ... fe_harbors

Maybe towards the end of the year I could look at #crunchers' info and figure it out?
[/QUOTE]

If AGI is > $150K ($75K if MFS), then yes, 110%, otherwise 100%. As long as I meet the safe harbor, I don't worry about what my taxes actually will be, since I have no issues with liquidity to pay whatever the tax is. 

I'm usually too lazy to run tax scenarios at the end of the year. I intended to do so to figure out how much of a Roth conversion I could do for 2022, but I knew it wouldn't be very large, so I just skipped it.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Estimated Taxes and Original Issue Discount (OID)TIPS Taxable
			
[QUOTE: hudson wrote: Sun Mar 26, 2023 10:15 am]
hudson wrote: Sun Mar 26, 2023 10:15 am
How does one figure out the OID for quarterly estimated taxes in a taxable account.

I might use withholding from a Required Minimum Distribution (RMD) account instead of quarterly tax payments.
[/QUOTE]

Does your situation warrant using the safe harbor of paying 100% or 110% of previous years tax liability? This is what I do unless I have unusually high income in the previous year, in which case I want to pay less than what I paid last year.

I use withholding from my RMD to pay my tax in most years, the advantage being that it's much simpler, and you can do it any time and not get dinged for withholding enough earlier in the year (I usually take my RMD toward the end of the year).

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Wed Mar 22, 2023 5:01 pm]
HereToLearn wrote: Wed Mar 22, 2023 5:01 pm
The question I was trying to figure out is why Fidelity has it listed as Short Term Gain instead of interest on their YTD tax chart.  Kevin suggested that I can ignore the current reporting and that it will be reported as interest when the tax forms are released next Feb.
[/QUOTE]

I had never even paid attention to the tax information, realized gain/loss web page. I had a note that also matured on 12/31/2022, with the payment on 1/3/2023, and I see that Fidelity also is showing the interest as a short term cap gain. This is simply wrong, so ignore it.

As another example, I traded box spreads last year, and had one expire in Jan 2023. The Fidelity tax page also shows this all as STCG, which is incorrect. Box spreads are 1256 contracts, which are reported as 40% STCG and 60% LTCG. Fidelity shows it on a 1099-B, with sub header "Section 1256 Option Contracts", and they even provide the 60/40 breakdown, although this is not used, since tax software does this calculation for you. You do not enter this as 1099-B in tax software, but on form 6781.

Ignore the Fidelity YTD gain/loss info--at least as far as the details go.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Wed Mar 22, 2023 3:22 pm]
HereToLearn wrote: Wed Mar 22, 2023 3:22 pm
I am fairly new to Treasuries and have a question about a maturing note being reported as a short term gain.  I am most likely using inaccurate language here so feel free to correct me where I have used the wrong terms.

My Fidelity YTD tax info lists the sale/maturing of a Treasury bill as a short term gain as opposed to interest.  I bought it in early August and it matured 12/31 but 'sold' on Jan 3rd.  

Why is it being reported as a short term gain and not as interest the way the maturing zero coupon bills have been reported? Does this mean that I will pay state income tax on the proceeds of any maturing Treasury that is not a zero coupon one? If that is the case, will longer dated maturities be reported as long term gains and taxed as such?

Security Description Qty Date Acquired Date Sold Proceeds** Cost Basis* Short-Term Gain/Loss Long-Term Gain/Loss
91282CBD2 UNITED STATES TREAS SER BL-2022 0.12500% 12/31/2022 NTS NOTE 100,000.0000 $100,000.00 $98,958.50 +$1,041.50

The above figures include a tiny amount of accrued interest ($14 in total) so I assume I will need to net that out against the total proceeds to determine the taxable proceeds. 

Thank you to Kevin for starting this thread and to the other helpful posters who have responded in detail.
[/QUOTE]

First, let's get the terminology straight, as that is key to understanding what type of Treasury we're talking about. You are talking about a note, not a bill--you used both terms, but "note" is correct.

Taxation of notes and bonds is covered briefly in the OP, and I think it answers your questions (mostly).

Ignore what Fidelity is showing in YTD tax info. When the income is reported for 2023, it should match what is described in the OP.

The stated interest (coupon payments) definitely is exempt from state income tax. I also treat accrued market discount as Treasury interest, so it also is exempt from state taxes in CA (IMO). There has been lots of discussion of this, and there seems to be some discrepancy in how different states treat it.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^In both cases, I believe "a" is correct.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Doc wrote: Mon Mar 20, 2023 1:26 pmKevin M wrote: Mon Mar 20, 2023 12:17 pm]
Doc wrote: Mon Mar 20, 2023 1:26 pm
Kevin M wrote: Mon Mar 20, 2023 12:17 pm
Bills are not considered market discount bonds, but are in a category of their own: short term US government obligations. The accrued acquisition discount is treated as interest, whether you buy at auction or on secondary.

I would assume that the tax treatment is the same if you sell before maturity. 

The difference between purchase cost and sale cost is all interest?

I can also see the possibility of having a loss if you buy or sell on secondary market. Is this a capital loss or negative interest?
[/QUOTE]

If you sell a bill before maturity, the accrued acquisition discount is interest. Any remaining difference between sale price and purchase price is short term capital gain or loss. When I sold my bills before maturity in 2019, most of the gain was interest (accr acq disc), with a little bit as cap gain/loss.

This is the same whether bought at auction or on secondary.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: elgob wrote: Sun Mar 19, 2023 3:46 pmKevin M wrote: Sun Mar 19, 2023 1:27 pmelgob wrote: Sun Mar 19, 2023 12:55 pmKevin M wrote: Sun Mar 12, 2023 1:45 pm]
elgob wrote: Sun Mar 19, 2023 3:46 pm
Kevin M wrote: Sun Mar 19, 2023 1:27 pm
elgob wrote: Sun Mar 19, 2023 12:55 pm
Kevin M wrote: Sun Mar 12, 2023 1:45 pm
Whether or not it's a reissue has no impact on tax reporting. I have never even paid attention to that.

Is "reissue" in this discussion being used to mean the same as "re-opened issue"?

And is it correct that if a T-bill bought at auction is a re-opened issue (as many are), there are no tax implications of that?

Thanks.

Correct. Bills don't have coupons, so accrued interest is not an issue, and that's the only very minor tax related issue I can think of for reopenings of notes or bonds.

So no market discount issue, OID, etc.?
[/QUOTE]

Nope. There is no market discount or OID for bills, only "acquisition discount". Read about it in Pub 550. Bills are not considered market discount bonds, but are in a category of their own: short term US government obligations. The accrued acquisition discount is treated as interest, whether you buy at auction or on secondary.

I've bought lots of T bills and have done a number of tax returns with bills involved, and I never even thought of this concern.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: elgob wrote: Sun Mar 19, 2023 12:55 pmKevin M wrote: Sun Mar 12, 2023 1:45 pm]
elgob wrote: Sun Mar 19, 2023 12:55 pm
Kevin M wrote: Sun Mar 12, 2023 1:45 pm
Whether or not it's a reissue has no impact on tax reporting. I have never even paid attention to that.

Is "reissue" in this discussion being used to mean the same as "re-opened issue"?

And is it correct that if a T-bill bought at auction is a re-opened issue (as many are), there are no tax implications of that?

Thanks.
[/QUOTE]

Correct. Bills don't have coupons, so accrued interest is not an issue, and that's the only very minor tax related issue I can think of for reopenings of notes or bonds.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			Whether or not it's a reissue has no impact on tax reporting. I have never even paid attention to that.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Wed Mar 08, 2023 1:44 pmstudent wrote: Wed Mar 08, 2023 11:43 am]
FactualFran wrote: Wed Mar 08, 2023 1:44 pm
student wrote: Wed Mar 08, 2023 11:43 am
Thanks again for your response. I called Etrade Tax Department again and was transferred to a different department. I talked to another person. She agreed with what I said. She called me back and left a message saying that she has reviewed my account, all my T-bills were held to maturity and there should be a number in box 3 in 1099-INT. She said the issue is across the board and no one receive this number in box 3 because and they are waiting for publication 1212 OID table from IRS. She was surprised that I said I had the correct number in box 3 of 1099-INT from other brokerage. She asked whether I can send her a copy.  

Any truth about them the need of 1212 OID table?

A brokerage would want to use the official OID tables for their clients who use the accrual method of accounting rather than the cash method.
[/QUOTE]

Yes, this is what I read in Pub 550. So, unless one has explicitly made this choice, T bill income is reported for the tax year in which it matures, and the OID table Section IIIA is irrelevant.

Vanguard and Fidelity will provide a 1099-INT entry for each bill in the year of maturity unless instructed otherwise. I have no experience with the latter, so T bill interest is reported in the year of maturity for all accounts I manage.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			In IRS Pub 1212 Section III we see this:

[QUOTE]
Section III.

This section contains short-term discount obligations.

Code: Select all    Section III-A: Short-Term U.S. Treasury Bills.

    Section III-B: Federal Home Loan Banks.

    Section III-C: Federal National Mortgage Association.

    Section III-D: Federal Farm Credit Banks.

    Section III-E: Federal Home Loan Mortgage Corporation.

    Section III-F: Federal Agricultural Mortgage Corporation.

Information that supplements Section III-A is available on the Internet at TreasuryDirect.gov/tdhome.htm..

The short-term obligations listed in this section are arranged by maturity date. For each obligation, the list contains the CUSIP number, maturity date, issue date, issue price (expressed as a percent of principal), and discount to be reported as interest for a calendar year per $1,000 of redemption price. Brokers and other middlemen should rely on the issue price information in Section III only if they are unable to determine the price actually paid by the owner.
[/QUOTE]

Note the part I underlined. Your broker certainly knows how much you paid.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^Sound like BS. The OID table is not used for short-term government obligations, which is what T bills are. The instructions on reporting OID for TIPS is in IRS pub 540, and is pretty clear. You should refer them to that.

I've done multiple tax returns for family and friends with TIPS in taxable at Vanguard, and the OID was reported correctly on 1099-OID for every one of them.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Mitchell777 wrote: Sun Mar 05, 2023 8:16 am]
Mitchell777 wrote: Sun Mar 05, 2023 8:16 am
I thought I understood this until I rec'd my Brokerage 1099-INT from Vanguard. I bought 12 Treasury Notes on secondary market in 2022. Only one matured in 2022 (on 12-31-22). The rest will mature in 2023 or 2024. Almost all were bought at below face value and almost all paid interest to me in 2022. I understand the $7245 in box 3 of 1099-INT is interest, $144 in box 12 is Bond Premium, $2548 shown as "Taxable accrued Treasury interest paid". I believe I enter $7245 as taxable interest in TT, and subtract from that $144 and the $2548 to get federal taxable interest of $4553... Is that correct?
[/QUOTE]

This is an example of why tax reporting for notes and bonds is more complicated than for bills, since the latter have no bond premium or accrued interest involved.

I'm not sure about TT, but with HRB you must use two 1099-INT forms in the program to do the accrued interest and ABP adjustments. When You do that, you end up with the gross interest on Schedule B, and two negative entries--one for acc int and one for ABP.

[QUOTE]
Now for the OID: I did not receive a 1099-OID form. There is a section on 1099-INT entitled OID and Adjustments but every line is a zero. When I look at the detail for each bond I do not see anything referencing OID. Should I have rec'd a 1099-OID form or will I need to handle that next year?
[/QUOTE]

Already answered. The OID is for TIPS only, unless you buy STRIPS.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			If you import your 1099 from Fidelity, you should end up with one or more 1099-OID forms in the 1099-INT interview topic. If they created more than one 1099-OID, I would delete all but one of them, and enter the OID total from your 1099-OID (that's what I did for my last return with Vanguard 1099-OIDs).

That's pretty much it for OID. I verified Vanguard's OID figures for a couple of returns, so I'm confident that one can just enter the numbers provided by Vanguard. I didn't have any TIPS in taxable at Fidelity (all in IRAs), so I can't verify Fidelity's OID numbers with my own accounts.

If anyone wants to share their 1099-OID from Fidelity (of course not revealing account numbers, etc.), I'd be happy to check it out.

Vanguard reports the TIPS interest payments on 1099-INT (a broker can choose to report them on 1099-OID). They also show accrued interest paid and amortized bond premium (ABP). As we've discussed, this requires two 1099-INT forms in HRB--one to do the accrued interest adjustment, and one to do the ABP adjustment. I do this just for the totals.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: exodusing wrote: Fri Mar 03, 2023 7:38 am]
exodusing wrote: Fri Mar 03, 2023 7:38 am
According to the WSJ, there are four Treasuries maturing 8/31/2023.  Three bonds or notes with yields of 5.078, 5.088 and 5.092, and one bill with yield of 5.134. That's a 14 bp spread among the bonds and notes and a 42 bp spread from the highest bond or note to the bill.

Is the difference likely due to taxation or liquidity or some technical factor or?
[/QUOTE]

I don't think this is related to taxation, so probably better to discuss in the trading Treasuries thread. Short answer follows.

What I see now for 8/31/2023 maturity is a bill with a high yield of 5.109, and three notes with yields of 5.033, 5.035, 5.033. So the big difference is between the bill and the notes. Bills often have higher yields than notes or bonds of same maturity. Personally, I don't worry about why, but just buy whatever has the highest yield for the maturity I'm looking for. In this case, I'd buy the bill.

There have been other cases recently where a note has higher yield than a bill of similar maturity, in which cases I buy the note.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			Another option would be to add links to the OP to replies that cover certain topics in depth, similar to the trading Treasuries thread.

As I've posted, I've done returns with TIPS in taxable at Vanguard. It's super easy once you figure it out; I'll try to get around to going through it in detail.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Tax implications of treasury notes
			
[QUOTE: dave1054 wrote: Thu Mar 02, 2023 10:49 am]
dave1054 wrote: Thu Mar 02, 2023 10:49 am
I have gotten conflicting information concerning tax consequences of buying treasury notes on the secondary market.
Most of the secondary treasury notes at this time are selling for a discount. If I purchase one and hold it to maturity, will I have to pay a capital gains tax when it matures at par. Thank you.
[/QUOTE]

The basics are covered in the OP of this thread (the one yours was merged into). Please read that first. If you still have questions, try searching this topic for more details on whatever it is you still don't understand; e.g., "accrued market discount". Finally, come back here with any remaining questions.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			So these bills matured in 2022 before 12/31/2022?

If so, then I would just add the interest to box 3 of the original 1099-INT. It doesn't matter which 1099 you report things in, as long as the numbers end up correctly on the forms included in the return.

I had some Treasury interest reported in a section of the 1099 not provided to the IRS, but the instructions clearly state that I need to report that interest. So, I don't worry if I report more income than has been reported to the IRS. I doubt they will care, and if they do, they'd just send you a refund check.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			student, so they reported the T bill interest in box 1 of the 1099-INT? I was confused by your first post, and though they reported it on 1099-B.

Isn't there an option to indicate that the 1099-INT is incorrect?

If you don't pay state income tax, it doesn't matter. If you do, then you want to correct it to get the state income tax exemption. I would see what my tax software options are, but I would definitely want to end up with the bill interest in box 3, because I do pay state income tax.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			Worked on another return today with lots  of TIPS in taxable, as well as Treasury accrued interest and amortized bond premium (ABP) for same 1099-INT.

As on a previous return I worked on, the Vanguard import results in a separate 1099-OID for each TIPS. This time I just entered the total OID in the first one, and deleted the rest. This reconciles with the 1099-OID total reported to the IRS, so should be fine. Much quicker.

For the acc int and ABP, I did the same thing as before:

 In original 1099-INT, change the box 3 amount to the original amount minus acc int.
Do the ABP adjustment on this 1099-INT.
Create a dummy 1099-INT for acc int.
Enter the acc int amount in box 3.
Do the acc int adjustment, entering the same amount as in box 3.

All easy peasy.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^Absolutely agree (with the last sentence)! I had fun and learned something from the interaction, and I think the collaborative process and result was worthwhile--or at least enjoyable.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			Here's the bullet point summary of the other video:

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: student wrote: Sat Feb 25, 2023 6:08 pmKevin M wrote: Sat Feb 25, 2023 5:09 pm]
student wrote: Sat Feb 25, 2023 6:08 pm
Kevin M wrote: Sat Feb 25, 2023 5:09 pm
It would be interesting to generate a transcript of the YouTube video, then ask ChatGPT to summarize it. There are tools out there to do this.

Anyone want to take on the transcription? If not, I'll continue to investigate, as this is more interesting than listening to the video and summarizing it myself.

Ok. Youtube itself provided the transcript. I needed to use a linux command to remove the timestamps. For https://www.youtube.com/watch?v=PdFkteP0xhI ChatGPT gives "In a video, the speaker addresses accrued interest on longer maturity treasury purchases. Accrued interest is the interest earned on the security from the date when the last interest payment was made up to the current date or evaluation. Accrued interest only applies to longer maturity treasuries such as notes and bonds, and not shorter term t-bills. When purchasing treasury notes and bonds in the secondary market, the purchase price will include the actual price of the treasury security, the accrued interest owed to the seller, and a markup, which is a fee charged by the broker. The previous investor who sold the treasury note needs to receive his/her accrued interest back. The market will require the new owner to share the interest payment with the previous owner through the accrued interest calculation. Some brokerage companies, such as Fidelity, Schwab, Vanguard, E-Trade, and Merrell, do not charge any fees for secondary Market treasury trades placed online.

I think one advantage of watching the video is beginner can watch her doing it online with different brokers.
[/QUOTE]

Cool! I found you can toggle off the timestamps with the hamburger menu in the transcript box. I asked ChatGPT to summarize using bullet points:

I think her distinction of longer term vs shorter term Treasuries is somewhat misleading, because it's not the term that matters, but the type; i.e., whether or not the Treasury has a coupon. You could have a note or bond due to mature in one week (very short term), but there still will be accrued interest.

The link between term and type is that Treasury only issues bills with maturities of 52 weeks or less, while notes have maturities of 2 to 10 years, and bonds have maturities of 10 to 30 years. She does make the distinction between bills, notes and bonds, but keeps throwing in "shorter term" or "longer term", when these terms only apply to the Treasury when issued, not necessarily when it trades on the secondary market. Very misleading I think.

With respect to the brokers, a single screenshot of the trade preview with accrued interest circled is all we need to add.

Thanks!

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			It would be interesting to generate a transcript of the YouTube video, then ask ChatGPT to summarize it. There are tools out there to do this.

Anyone want to take on the transcription? If not, I'll continue to investigate, as this is more interesting than listening to the video and summarizing it myself.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			OK, glad it worked to you. 

In my quick sampling, I saw lots of fluff that was not particularly informative, but I'm coming from a place of already understanding it. Also, I learn much more quickly by reading rather than by watching. I will almost always read a transcript, if available, rather than watch a video. For someone who is more of a visual and auditory learner, the videos could be better.

I think her key points could be summarized in a few bullet points, and then someone wanting to understand more could either ask here for further clarification, or watch the videos. I might do that as an exercise if I run out of other interesting or necessary things to do.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^What did you learn from these videos that isn't covered here? Nice videos, but very low information density (lots of words and pictures to explain something relatively simple). I did not watch them all, just sampled them.

Summarizing your key takeaways would save others the time of watching the videos!

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Goro wrote: Wed Feb 22, 2023 8:38 pm]
Goro wrote: Wed Feb 22, 2023 8:38 pm
Hi, thank you for nice info.

Last year, I bought treasury bills and notes on my brokerage account, and this is first year I received 1099 for these treasuries. I saw the interest on 1099-INT.

My question is 1099-B. Is my understanding correct? 
If I sold bill/notes before mature, it will generate 1099-B
If I kept bill until mature, it will not generate 1099-B
Even I kept notes until mature, it will generate 1099-B
[/QUOTE]

I sold both notes and bills before maturity in 2019 at Schwab. 

Only the notes were on the actual 1099-B, with accrued interest in box f, as has been discussed.

The bills appeared on a year end gain/loss summary not reported to the IRS, with the instruction to report on Form 8949. You must calculate accrued acquisition discount yourself, subtract it from the gain/loss, and manually enter it in a dummy 1099-INT.

Bills that mature appear only on 1099-INT.

Notes that mature appear on 1099-B with market discount in box f.

You can find details by searching this topic for "Schwab 2019".

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			For the account I've been referencing in my last few posts, there were six pages of OID details for TIPS. I still wanted to calculate OID myself, but I had to take a simpler approach than for the account with only one TIPS in it. I did not calculate OID for each month for each tax lot, as Vanguard does. I just calculated from the settlement date to 1/1/2023 for each tax lot. I did no rounding of ref CPIs or index ratios. Here is the resulting table, including the OID reported for Vanguard for each tax lot:

Note that the tax lot totals were within +/- $0.01 of each other, and the grand totals are $0.04 different, but round to the same dollar value.

The hidden rows above this table are the TIPS transactions from the 2022 transactions imported from Vanguard, along with some columns to calculate or look up. Here are the first few rows with the uninteresting columns hidden:

The formula used to populate columns A through M is:

Code: Select all=FILTER(JasonTrans!B:M,FIND("INFLATION",JasonTrans!F:F))

(I don't think disclosing a first name in the sheet name is an issue.)

The JasonTrans sheet contains the imported Vanguard download for 2022 transactions. Only TIPS transactions contain "INFLATION" in the Investment Name.

Here are the columns with example formulas in the first (OID) table:

Cpn: from investment name, e.g., =MID(E2,FIND("CPN",E2)+4,5)%
Maturity: from investment name, e.g., =VALUE(MID(E2,FIND("MTD",E2)+4,10))
CUSIP: lookup based on maturity date and coupon, e.g., =FILTER(TIPSref!A:A,TIPSref!D:D=M2,TIPSref!C:C=N2) (Vanguard does not include the CUSIP in the export)
Dated date: lookup based on CUSIP, e.g., =VLOOKUP(O2,TIPSref!A:E,5,0)
Dated date ref CPI: lookup based on CUSIP, e.g., =VLOOKUP(O2,TIPSref!A:E,5,0)

The formula to populate the first rows of the OID table is this:

Code: Select all=SORT(QUERY(B2:Q29,"select O,B,G,Q where G>0"),1,1,2,1)

Here are the example formulas to populate the other columns in the OID table:

Settle ref CPI: =VLOOKUP(B33,RefCPI!A:C,3,0)
Settle IR: =E33/D33
Settle adj amt: =$C33*F33
1/1/23 index rato: =$B$31/D33
1/1/23 amt: =$C33*H33
OID: =I33-G33

The VG 1099-OID column number are copied from the Vanguard 1099-OID details.

Bottom line is that this is further verification that the Vanguard OID numbers are fine to use.

As a side note, the import from Vanguard to HRB includes a 1099-OID form for each tax lot, so 21 1099-OID forms! It's a bit of a pain to go through each one just to verify it with HRB. 

This is similar to the way Vanguard downloads a 1099-DIV for each mutual fund for mutual fund accounts, whereas it downloads a single 1099-DIV for brokerage accounts, with the details in a details section of the 1099.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: AAA wrote: Wed Feb 22, 2023 9:49 amKevin M wrote: Tue Feb 21, 2023 6:56 pm]
AAA wrote: Wed Feb 22, 2023 9:49 am
Kevin M wrote: Tue Feb 21, 2023 6:56 pm
I doubt they check at this level. I used a cpa one year, and he deducted all accrued interest reported paid for the year, regardless of whether or not there were interest payments for every bond in that tax year. No IRS issues, and that was more than 2 years ago.

I believe that accrued interest is not reported to the IRS, so how could they check it except in an audit?
[/QUOTE]

Right. Here's a note in the "Detail for interest income" section of Vanguard's composite 1099:

[QUOTE]
To provide a complete picture of activity for each investment, we also include here nonreportable transactions such as accrued interest paid on purchases and payment or receipt of nonqualified interest. Other amounts, such as federal, state and foreign tax withheld and investment expenses are shown as negative amounts but do not net against the reportable income totals.
[/QUOTE]

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Accrued int and ABP adjustments for one 1099-INT using HRB
			
[QUOTE: HereToLearn wrote: Tue Feb 21, 2023 5:33 pmKevin M wrote: Tue Feb 21, 2023 2:25 pm]
HereToLearn wrote: Tue Feb 21, 2023 5:33 pm
Kevin M wrote: Tue Feb 21, 2023 2:25 pm
I just did the HRB Treasury interest entries for an account that had both amortized bond premium (ABP) and accrued interest, for which we need two 1099-INTs to do both adjustments (you can only do one per 1099-INT). 

First, I left the box 3 amount as is, and did the ABP for this one.

Next, I tried to enter 0 in the 1099-INT to do the accrued interest adjustment, but it did not show up on Schedule B.

So, I subtracted the amount of accrued interest from the first 1099-INT, and entered that amount in box 3 of the second 1099-INT, and did the accrued interest adjustment (so this 1099-INT shows 0 net interest). Now both the ABP and acc int adjustments are showing properly on Schedule B.

As we've discussed, you can split the interest up any way you want between the two 1099-INTs, but it felt clean to me to have the interest amount equal the accrued interest amount on the second 1099-INT.

This account had many Treasuries in it (bills, notes/bonds, TIPS). All of them paid interest in 2022 except one. I am including all reported accrued interest on the 2022 return.

Kevin

Question regarding this statement:  "This account had many Treasuries in it (bills, notes/bonds, TIPS). All of them paid interest in 2022 except one. I am including all reported accrued interest on the 2022 return."

More of my accrued interest from 2022 is associated with notes that did not pay until early 2023.  I assume that I should only include the 2022 accrued interest amount for those notes that paid interest in 2022, and carry forward the balance to be offset against 2023 interest.  Is that correct?  

Thanks!
[/QUOTE]

That seems to be the common interpretation of IRS pubs. In the case of the return I mentioned, the amount is small, and I didn't think it was worth it to have to worry about it next year.

In the past when I've had a significant amount of accrued interest with no associated  coupon payments, I did as you have described.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: dual wrote: Tue Feb 21, 2023 5:40 pm]
dual wrote: Tue Feb 21, 2023 5:40 pm
Kevin 

This account had many Treasuries in it (bills, notes/bonds, TIPS). All of them paid interest in 2022 except one. I am including all reported accrued interest on the 2022 return.

I will be interested to see what the IRS matching program makes of your tax return.
[/QUOTE]

I doubt they check at this level. I used a cpa one year, and he deducted all accrued interest reported paid for the year, regardless of whether or not there were interest payments for every bond in that tax year. No IRS issues, and that was more than 2 years ago.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Accrued int and ABP adjustments for one 1099-INT using HRB
			I just did the HRB Treasury interest entries for an account that had both amortized bond premium (ABP) and accrued interest, for which we need two 1099-INTs to do both adjustments (you can only do one per 1099-INT). 

First, I left the box 3 amount as is, and did the ABP for this one.

Next, I tried to enter 0 in the 1099-INT to do the accrued interest adjustment, but it did not show up on Schedule B.

So, I subtracted the amount of accrued interest from the first 1099-INT, and entered that amount in box 3 of the second 1099-INT, and did the accrued interest adjustment (so this 1099-INT shows 0 net interest). Now both the ABP and acc int adjustments are showing properly on Schedule B.

As we've discussed, you can split the interest up any way you want between the two 1099-INTs, but it felt clean to me to have the interest amount equal the accrued interest amount on the second 1099-INT.

This account had many Treasuries in it (bills, notes/bonds, TIPS). All of them paid interest in 2022 except one. I am including all reported accrued interest on the 2022 return.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: H&R Block SCHP and NC state taxes
			
[QUOTE: hudson wrote: Tue Feb 21, 2023 8:23 am]
hudson wrote: Tue Feb 21, 2023 8:23 am
H&R Block Deluxe + E-File+ State Tax Software for Windows
SCHP...TIPS ETF...no state taxes

Does the H&R Block software handle "no state taxes" on SCHP (or individual treasuries) or do I need to handle it manually?
[/QUOTE]

In the HRB 1099-DIV form, the dividends will appear in box 1a, Ordinary dividends, if imported, or you enter it there from the 1099-DIV provided by the broker. At the bottom, check the box "From US Treasury obligations". On the next screen enter the percent USGO, which I assume is 100% for a TIPS ETF, but your broker should provide this information. This will pass through to the state tax forms as Treasury income, which as you know is exempt from state income tax.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: FactualFran wrote: Mon Feb 20, 2023 2:23 pmcas wrote: Mon Feb 20, 2023 12:06 pm]
FactualFran wrote: Mon Feb 20, 2023 2:23 pm
cas wrote: Mon Feb 20, 2023 12:06 pm
(Please note:  if people want to pick up the unresolved discussion on "which 1099-INT box is it?" again, that probably has the potential to clog up this thread for people trying to grasp specific tax reporting questions.  As I indirectly linked above, that has already been fairly extensively discussed in a different thread.  Up to Kevin, really, what thread he would rather future discussion on the "which 1099-INT box is it?" question goes.

It is likely a good idea to have separate topics for 1) what is to be on Federal and State income tax returns and 2) how to get certain tax preparation software to produce what is to be on income tax returns.

Manually entered dummy 1099s?  Yikes!

Income tax preparation software should import real 1099s.  The software might need to ask for additional information, such as whether there are adjustments, such as accrued interest, to be made to the values in imported 1099s.  The software should ask for enough information to produce correct Federal and State income tax returns.
[/QUOTE]

Maybe the software should do that, but it doesn't, so we must find workarounds. Discussing those is within the scope of this thread.

The reason to divert discussions of the taxation of Treasury accrued market discount at the state level to the other thread is that it already has been discussed extensively in that thread, so discussing it here would be repetitive.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Mon Feb 20, 2023 12:06 pm]
cas wrote: Mon Feb 20, 2023 12:06 pm
(Please note:  if people want to pick up the unresolved discussion on "which 1099-INT box is it?" again, that probably has the potential to clog up this thread for people trying to grasp specific tax reporting questions.  As I indirectly linked above, that has already been fairly extensively discussed in a different thread.  Up to Kevin, really, what thread he would rather future discussion on the "which 1099-INT box is it?" question goes.
[/QUOTE]

I agree with your thinking. Let's use the other thread for any detailed discussion of "which box?". I recommend that anyone struggling with (or just interested in) this issue read that thread first, then ask additional questions or provide additional inputs in that thread.

Thanks,

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Verification of OID reported by Vanguard for TIPS
			
[QUOTE: Klewles wrote: Mon Feb 20, 2023 2:55 amMisterMister wrote: Sun Feb 19, 2023 11:51 amKevin M wrote: Sat Feb 18, 2023 9:15 pm]
Klewles wrote: Mon Feb 20, 2023 2:55 am
MisterMister wrote: Sun Feb 19, 2023 11:51 am
Kevin M wrote: Sat Feb 18, 2023 9:15 pm
I completed my first verification of the OID reported for TIPS by Vanguard just now. My calculated results match Vanguard's exactly.

Vanguard OID details for TIPS look like this:

I found this a little confusing at first. Here is the interpretation.

For this account, there were two purchases of the TIPS maturing 1/15/2023: one purchase of 40 on 8/11/22 and one of 10 on 8/16/22.
The first date shown for each lot is the purchase settlement date, and the subsequent dates are the first of each subsequent month up to December.
The OID shown for a date is the inflation adjustment for that date to the first of the next month.
A total is shown for each lot, with the grand total at the bottom. This is the number shown on 1099-OID.

Here are the instructions for calculating OID for TIPS from IRS Pub 1212:

1. Add the inflation-adjusted principal
amount for the day after the last day of the
tax year and any principal payments you
received during the year. (For TIPS, multi-
ply the par value by the index ratio for the
day after the last day of the tax year, and
add any principal payments received.)

2. Subtract from (1) above the inflation-ad-
justed principal amount for the first day on
which you held the debt instrument during
the tax year. (For TIPS, subtract from (1)
above the product of the par value times
the index ratio for the first day held during
the tax year.)

Following these instructions, we'd just calculate the OID from purchase settlement to 1/1/2023, but we can calculate it for each month as Vanguard does by using the first day of the next month for each row.

Here is a table showing the results of my calculations:

We can see that these numbers match Vanguard's exactly!

For the last row of each lot, I calculated the OID from settlement to 1/1/2023, which equals the total of the individual month's OIDs.

I already have a spreadsheet with ref CPI for each date, which I import into this sheet, and then grab the ref CPI for each date from there using VLOOKUP on the date.

Index ratio for each date is calculated by dividing ref CPI for that date by dated date ref CPI, which I also import from another spreadsheet.

Inflation adjusted principal is just the face value times the index ratio.

OID for each row is the inflation adjusted principle for the first of the next month minus the inflation adjusted principal for the current row.

So, no problems so far with just entering the Vanguard OID number from 1099-OID into tax software, or using the imported 1099-OID. Yay!

I'll check the OID for the other Vanguard accounts that held TIPS in 2022 as I work on those tax returns. I did not hold any TIPS in taxable at Fidelity in 2022, so won't be able to check Fidelity OID for TIPS--at least not based on the accounts I manage.

Kevin

With the Fidelity 1099-OID, you'd see only a single line item for the CUSIP, showing a total OID of 929.57.  If you wanted to match that figure you'd need to avoid using the index ratios directly (5 digits of precision are not enough), and go back to the reference CPIs as you've done.

The dated reference CPI for the 1/15/23 TIPs was 230.82203, so calculating the OID for the two lots totals for the year would look like this:

[(298.01200 - 293.59116) / 230.82203] (40000) = $766.10
[(298.01200 - 294.23874) / 230.82203] (10000) = $163.47

for a total of 929.57

This is the approach I had to take to verify my own Fidelity 1099-OID.

Treasury Direct's 1099 reports OID a bit differently than Vanguard or Fidelity.  For the 1/15/2023 TIPS, TD would calculate as follows:

CPI 2013-01-15: 230.82203
CPI 2022-08-11: 293.59116
CPI 2022-12-31: 297.97316

index ratio: 2022-08-11 1.2719400000 (rounded to 5 decimal places)
index ratio: 2022-12-31 1.2909200000 (rounded to 5 decimal places)

principal 2013-01-15: 40000.00
principal 2022-08-11: 50877.60
principal 2022-12-31: 51636.80

OID for 2022: 759.20

Remarks:  TD rounds index ratios to 5 digits of precision, per 31 CFR Chap. 11 Part 356 App. B; as opposed to Vanguard and Fidelity, which use full precision index ratios.  TD uses Dec 31 as end date for yearly OID interval; as opposed to Vanguard and Fidelity, which use Jan 1.

Years ago I wrote some code to track my TIPS portfolio based on the 31 CFR regulations.  It gets exact OID matches to my TD 1099's, but only approximate matches to my Vanguard 1099's.
[/QUOTE]

IRS Pub 1212 specifically states to use the day after the last day of the tax year, which is 1/1/2023 for 2022 returns. So, TD is doing it incorrectly according to the pub. #Cruncher has specifically mentioned that OID needs to be recalculated for TD 1099-OID.

I believe that #Cruncher has said that both ref CPI and index ratio should be rounded to 5 decimal places. If I round the ref CPIs this way, I get the same results as with no rounding. However, if I round index ratios to 5 decimal places, the numbers change slightly.

For the 40 lot I get 766.00 instead of 766.10, so both would be entered as 766.

For the 10 lot I get 163.50 instead of 163.47. The former is entered as 164 and the latter as 163 in HRB, so this would make a total difference of $1 for both lots.

The CFR Appendix says truncate to 6 and round to 5 for both ref CPI and index ratio. If I do that, I get the same results as just rounding to 5.

I am sticking with calculations that match the Vanguard OID numbers. The difference is tiny, and I'd prefer that the reported numbers match the 1099-OID numbers.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^This is what I've done in the past. If your position is that Treasury market discount is exempt from your state income tax, you enter it in box 3 of the dummy 1099-INT, and if not, box 1.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			I just tried 1099-INT in HRB with 1,000 each in box 1 and 3, and with a 100 accrued interest adjustment. The 1040 shows 1,900 interest, as expected.

The accrued interest does indeed get prorated, as the CA subtraction from the Fed 1,900 taxable is 950 leaving $950 taxable. 

Assuming the acc int was for just the Treasury, splitting into two 1099-INTs with the accrued int taken from the Treasury one, we get 1,900 Fed, 900 subtracted for CA, leaving 1,000 taxable by state, which is correct since the non-Treasury (e.g., CD) $1K is taxable by the state.

So, failing to split them will result in paying less state tax than owed.

So, in this case splitting them is the correct solution. I missed the part about having income in box 1 as well as box 3.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Sun Feb 19, 2023 2:48 pm]
HereToLearn wrote: Sun Feb 19, 2023 2:48 pm
CAS--or anyone else who has already been through this and understands.

Thank you again for this highly detailed explanation.

I just want to triple check before I start deleting things in TurboTax.

The example you provided above outlines my situation:  A 1099-INT from Fidelity reporting both CD interest and T-bill interest, and I some of the T-bill purchases had accrued interest, some of which had payments in 2022 and some in 2023.

I am reviewing the purchase confirmations which had accrued interest and then once I confirm which had coupon payments in 2022, I should delete the T-bill interest from the Fidelity 1099-INT I imported and create a new 1099-INT to report both the T-bill interest paid AND the adjustment for accrued interest.  Is that correct?  

Or do I need to delete the 1099-INT entirely and create two new entries:  one for the CD interest, which does not require and adjustments, and one of the T-bill interest, which does require adjustments?  In other words, will it suffice to simply delete the T-bill interest and then create a new INT-1099 for the T-bill interest less accrued interest.

Thank you!
[/QUOTE]

First, Treasury bills do not pay interest, so there cannot be accrued interest. You are talking about a notes and/or bonds (it doesn't matter which).

I use HR Block, but TT should be similar, and is as I recall from when I used it.

You do not delete the 1099-int. There should be a box to include an adjustment, which in HRB is "Interest income requires and adjustment". After clicking that, I see several choices, including "Bought or sold this bond between interest payments", which I select. On the next screen I can enter the accrued interest, which for the buyer is entered as a positive number. The software will then include a negative number for the accrued interest adjustment on Schedule B.

Technically you should only include accrued interest for notes or bonds that paid interest in 2022, and deduct the remainder for 2023 taxes.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^Thanks for sharing this. I like your simplification of the algebra. I wanted to do it first in a way that followed the IRS instructions step by step.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^I had not completed the interview in HR Block before writing the above post. Turns out the Vanguard import created a 1099-OID for each tax lot, so one for the 10,000 and one for the 40,000.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Verification of OID reported by Vanguard for TIPS
			I completed my first verification of the OID reported for TIPS by Vanguard just now. My calculated results match Vanguard's exactly.

Vanguard OID details for TIPS look like this:

I found this a little confusing at first. Here is the interpretation.

For this account, there were two purchases of the TIPS maturing 1/15/2023: one purchase of 40 on 8/11/22 and one of 10 on 8/16/22.
The first date shown for each lot is the purchase settlement date, and the subsequent dates are the first of each subsequent month up to December.
The OID shown for a date is the inflation adjustment for that date to the first of the next month.
A total is shown for each lot, with the grand total at the bottom. This is the number shown on 1099-OID.

Here are the instructions for calculating OID for TIPS from IRS Pub 1212:

[QUOTE]
1. Add the inflation-adjusted principal
amount for the day after the last day of the
tax year and any principal payments you
received during the year. (For TIPS, multi-
ply the par value by the index ratio for the
day after the last day of the tax year, and
add any principal payments received.)

2. Subtract from (1) above the inflation-ad-
justed principal amount for the first day on
which you held the debt instrument during
the tax year. (For TIPS, subtract from (1)
above the product of the par value times
the index ratio for the first day held during
the tax year.)
[/QUOTE]

Following these instructions, we'd just calculate the OID from purchase settlement to 1/1/2023, but we can calculate it for each month as Vanguard does by using the first day of the next month for each row.

Here is a table showing the results of my calculations:

We can see that these numbers match Vanguard's exactly!

For the last row of each lot, I calculated the OID from settlement to 1/1/2023, which equals the total of the individual month's OIDs.

I already have a spreadsheet with ref CPI for each date, which I import into this sheet, and then grab the ref CPI for each date from there using VLOOKUP on the date.

Index ratio for each date is calculated by dividing ref CPI for that date by dated date ref CPI, which I also import from another spreadsheet.

Inflation adjusted principal is just the face value times the index ratio.

OID for each row is the inflation adjusted principle for the first of the next month minus the inflation adjusted principal for the current row.

So, no problems so far with just entering the Vanguard OID number from 1099-OID into tax software, or using the imported 1099-OID. Yay!

I'll check the OID for the other Vanguard accounts that held TIPS in 2022 as I work on those tax returns. I did not hold any TIPS in taxable at Fidelity in 2022, so won't be able to check Fidelity OID for TIPS--at least not based on the accounts I manage.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Newaygo wrote: Thu Feb 16, 2023 9:19 pm]
Newaygo wrote: Thu Feb 16, 2023 9:19 pm
Today, I manually input my Schwab 1099 composite. In 2022 I bought a US treasury with an "accrued market" discount which also matured in 2022.  The 1099-B shows the accrued market discount in Box 1f  which results in a zero realized g/l.  The H&R Block software warns that the accrued market discount needs to be reported in the 1099-Int. The Schwab 1099-Int does not report the discount amount in Box 3 US Treasuries and Box 10 Market Discount.

I assume that the Schwab 1099 Int is incorrect.  I have to report the discount as interest income. Am I missing anything?
[/QUOTE]

First, you don't buy a bond with "accrued market discount", you buy a bond with a "market discount". The accrual occurs after you buy the bond.

The amount of accrued market discount (accrued since you bought the bond) is taxed as ordinary income. This is covered in the OP. Please read that first, then come back with any remaining questions.

For HR Block, the market discount is subtracted from the "gain", as you describe, then you need to manually enter it in a dummy 1099-INT, with the description "Accrued market discount"). I enter it in box 3 (USGO), since I believe it is exempt from state income tax, as do others; this has been discussed in this thread.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Selling T Bill before maturity tax implications
			
[QUOTE: student wrote: Wed Feb 15, 2023 6:54 pmKevin M wrote: Tue Nov 22, 2022 6:11 pmcurmudgeon wrote: Tue Nov 22, 2022 5:32 pmTubes wrote: Tue Nov 22, 2022 12:32 pm]
student wrote: Wed Feb 15, 2023 6:54 pm
Kevin M wrote: Tue Nov 22, 2022 6:11 pm
curmudgeon wrote: Tue Nov 22, 2022 5:32 pm
Tubes wrote: Tue Nov 22, 2022 12:32 pm
It is one reason I like to buy Bills at Auction and hold to maturity.  Easy peasey.

After running into some of this tax messiness one year, I decided to limit my holdings on the taxable side to CDs, tbills, and funds which have simpler tax reporting.  I buy secondary market bonds only in tax deferred accounts.  This requires a bit of adjustment in how I manage our holdings, but it makes tax filing easier.

Since this thread is intended to help people with their tax reporting, would you mind sharing the tax reporting difficulties you encountered?

It is not an issue for bills bought on secondary if you hold to maturity--all accrued acquisition discount (aka interest) is reported in box 3 of 1099-INT. There are only complications if you sell before maturity.

I do not want complications, so I intend to hold all my T-bills to maturity. Either I am not understanding it or Etrade made a mistake on my form.

Here is the situation. Some T-bills (purchased in the secondary market) matured in 2022, at Etrade. My understanding is that the interest should be reported in Box 3 of 1099-INT. It was not. I called to inquire at their tax department, and the person said he will message me when he has an answer. I got the message that said "There will be another 1099 release. T-Bills report on the unknown terms section of the 1099-B form so we wouldn't report the cost basis as normally these are self-reported by client. You should get a 1099-B. Likely with the T bills reporting on the unknown terms and you have to self-report the basis which can be found in Gains & Losses and trade confirmation."

This does not seem right since I held them to maturity. Any suggestion on what magic words to use when I call them again so that they can fix it properly?

Thanks.
[/QUOTE]

I don't know the magic words, but this certainly is not the way Fidelity or Vanguard report it, which is at it should be--interest in box 3 of 1099-INT, with a breakout of the details in a supplemental section. We held these bills to maturity. Nothing to do with these T bills appeared on 1099-B from these brokers.

What I probably would do is copy and paste the relevant sections from IRS Pub 550 and send it to them. I would think that if they are not generating the 1099-INT according to IRS instructions, they would want to fix that.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kookaburra wrote: Wed Feb 15, 2023 2:07 pm]
Kookaburra wrote: Wed Feb 15, 2023 2:07 pm
Two questions about purchasing a Treasury note within a pre-tax 401k (self-directed brokerage account):

1. Can I ignore the part about accrued interest?

2. Does the advertised YTM already take into account accrued interest, so that I can just focus on YTM?

Thank you
[/QUOTE]

You don't pay taxes on Treasury interest in a 401k, so this thread is not relevant to your question #1, and question #2 is not about taxes. A better thread to ask question #2 is Trading Treasuries (nominal and TIPS) - Bogleheads.org.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: nalor511 wrote: Wed Feb 15, 2023 2:02 pmsdvan wrote: Tue Feb 14, 2023 3:32 pm]
nalor511 wrote: Wed Feb 15, 2023 2:02 pm
sdvan wrote: Tue Feb 14, 2023 3:32 pm
Can I use a specific example to help understand:

I recently purchased a .75% treasury note that matures on Dec. 31, 2023.  I purchased at a discount and the yield to maturity should be 5.09%.  I plan to hold this note to maturity.

Based on prior threads, I suspect that the sale will show up as a 2024 sale.  So, my 2023 tax implications should just be non-state taxable interest.

The question I am wondering is how the sale proceeds will be handled.  Will the proceeds be "interest", a combination of interest and capital gains, or capital gains?  Will the proceeds be state tax free in California?

Thanks for helping me understand by using an example.

Similar to this one, I have a TNote that paid coupon interest 12/31/2022, but it did not hit *my* account until 1/3/2023. It's not on my 2022 1099-int(consolidated). Fidelity says it will go on my 2023 1099-int(consolidated). 

My 2022 1099 supplemental info has the accrued interest stated, but I obviously cannot deduct $54 accrued.interest from interest of $0. Just to confirm that's the proper thing to happen, shifting this all to TY2023? Thank you
[/QUOTE]

Correct. You need to make a note to include the accrued interest paid in 2022 on your 2023 return.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: NavyIC3 wrote: Sun Feb 12, 2023 7:17 am]
NavyIC3 wrote: Sun Feb 12, 2023 7:17 am
From my Fido 1099. 
I have more Accrued Interest Paid  on Purchases of Treasuries ($840) than I have Interest on Treas. Obligations ($687). This means I will show a negative interest on Sched. B after deducting Nominee Interest. Is this correct?
[/QUOTE]

I don't believe so. For any Treasury for which you received a coupon payment in 2022, the accrued interest would have been part of that payment, so the interest paid would be greater than accrued interest. The issue is exactly as I described in my last reply: you don't include accrued interest on the 2022 return if you did not receive an interest payment in 2022. You need to keep track of accrued interest paid in 2022 for which there were no coupon payments in 2022, and deduct it on your 2023 return.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			^This all sounds familiar. I think I did something similar when I had both ABP and accrued interest for bonds.

Thanks for mentioning that the 1099s are available at Fido today. I downloaded mine, and did all the data entry into HRB today.

I have pretty much completed my Fed return, and was surprised by how much less I made in interest than in 2021, especially since rates have been higher in 2022. In researching it, I saw that most of the Treasuries I bought in 2022 do not mature until 2023 or later, so most of the income interest will not be reported in 2022.

The only Treasury interest at Fidelity was from three bills that matured, so no coupon or accrued market discount income. DW had a couple of bills that matured at Vanguard. That"s it for Treasury income in 2022. Very simple.

I did pay accrued interest on a note bought in 2022 that did not pay any interest in 2022, so I made a note to include this in 2023 tax reporting.

The new thing for me was income tax reporting for box spreads, which are section 1256 option contracts, but I shared that in the Let's Talk SPX Box Spreads - Page 10 - Bogleheads.org thread.

The next new thing for me will be tax reporting for TIPS, but all taxable TIPS purchases were for other people's accounts at Vanguard, and those 1099s are not available yet.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: AAA wrote: Sun Jan 29, 2023 9:33 amKevin M wrote: Wed Jan 18, 2023 12:11 pm]
AAA wrote: Sun Jan 29, 2023 9:33 am
Kevin M wrote: Wed Jan 18, 2023 12:11 pm
Tax software lets you make an adjustment for accrued interest. It is reported by the broker in the year of purchase in a supplemental section of the composite 1099. You make the adjustment in the year of the first coupon payment, so don't forget about the accrued interest if the first coupon payment is not in the year of purchase.
Kevin

So glad you wrote this as I just encountered the situation while working on my taxes. I had some Treasuries at one brokerage, with amounts for 1099-INT and accrued interest. I see where the latter shows up on Schedule B and is subtracted from the reported interest.

Treasuries at another brokerage hadn't yet made their first payment, so 1099-INT amount is 0, which is what I entered. When I entered the accrued interest amount it did not show up in Schedule B even though there was other interest it could have reduced. So as you said I will have to use it on next year's taxes.

Just curious - as I entered the unused accrued interest amount in the H&R Block program and it is not used for the 2022 return, is the program smart enough to know to use it next year when interest is reported from this brokerage (which I will make a note to check) or - more likely - should I just remove it and make a note to use it next year?
[/QUOTE]

Interesting. I would remove it, since no interest was reported on 1099-INT.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=200

Re: Tax implication of coupon vs gain through treasury bonds
			
[QUOTE: sherwood88 wrote: Sat Jan 21, 2023 5:27 pmKevin M wrote: Sat Jan 21, 2023 5:08 pmsherwood88 wrote: Sat Jan 21, 2023 8:30 am]
sherwood88 wrote: Sat Jan 21, 2023 5:27 pm
Kevin M wrote: Sat Jan 21, 2023 5:08 pm
sherwood88 wrote: Sat Jan 21, 2023 8:30 am
Another follow up questions:

Say, my form shows $125 on accrued interest paid on PURCHASES but only received for calendar year 2022 $101 on 10/1/2022.

My tax form shows I received $101 on front 1099-INT.

Two questions:
1. I think, I can deduct $125 from $101? So I don't have to pay tax on $101 (?) and can I carry over $24 for next year or able to deduct from other interest income that I have from other sources.

2. Do I need to calculate accrual part of income that I have NOT received (from 10/1/22-12/31/22). i.e. Income earned but not received in cash.

thanks

1. Here is what IRS pub 550 says:

Accrued interest on bonds.

If you received a Form 1099-INT that reflects accrued interest paid on a bond you bought between interest payment dates, include the full amount shown as interest on the Form 1099-INT on Schedule B (Form 1040), Part I, line 1. Then, below a subtotal of all interest income listed, enter “Accrued Interest” and the amount of accrued interest you paid to the seller. That amount is taxable to the seller, not you. Subtract that amount from the interest income subtotal. Enter the result on line 2b of Form 1040 or 1040-SR. 
It doesn't address your question directly, but I think as long as you don't end up with a negative total on Schedule B you will be fine. If you prefer, you could deduct only 101 of it, and deduct the rest in the following tax year.

2. No. You only pay tax on stated interest (i.e., coupon payments) for the tax year received.

You can search this thread for "accrued interest" to see discussions we've already had about it.

Kevin

Thanks Kevin. This is very helpful thread and wish I knew lot of stuff that was discussed. 

Just to follow up for clarity for me and others...
I have paid $125 (accrued int paid) but only received $101 is because only 1 out of 2 bond coupon was received before the year end as other coupon will come in following years.

Does that mean, I should only deduct a accrued int paid from a bond and align coupon received. Pay tax for 2022 on $101-$75 = $26 and pay tax on 2023 $60-$50 = $10?

i.e. Bond A:  $75 accrued int paid and received $101 in 2022
Bond B:  $50 accrued int paid and received $0 in 2022 and will come $60 in Feb 2023

thanks
[/QUOTE]

As I recall, you're supposed to deduct the accrued interest for a bond in the year of the first coupon payment. Based on that, what you suggest is correct. However, I don't think there will be any problem if you deduct all the accrued interest as long as you have enough interest income to offset it. 

I used a CPA one year to do my taxes, and he deducted all accrued interest paid in the year, even though some of the bonds didn't pay interest that year. However, the CPA made tons of mistakes that I had to correct, so I wouldn't assume this was actually correct.

Subsequently, in doing my own tax returns, I deducted only the accrued interest for bonds that paid interest in the year of purchase, and deducted the rest the following year.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Misenplace wrote: Sat Jan 21, 2023 4:13 pm]
Misenplace wrote: Sat Jan 21, 2023 4:13 pm
Edit to add: Correction, only the recent portion of this thread was merged into the master thread. Since OP's first post was Oct. 22, merging the entirety of the threads made it the first post in Kevin's master thread, which is not what I think anyone wanted.   I have merged this more recent discussion into the master thread, and left OP's discussion from Oct. in it's own thread in Personal Finance.
[/QUOTE]

Perfect! Thanks.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Tax implication of coupon vs gain through treasury bonds
			
[QUOTE: sherwood88 wrote: Sat Jan 21, 2023 8:30 am]
sherwood88 wrote: Sat Jan 21, 2023 8:30 am
Another follow up questions:

Say, my form shows $125 on accrued interest paid on PURCHASES but only received for calendar year 2022 $101 on 10/1/2022.

My tax form shows I received $101 on front 1099-INT.

Two questions:
1. I think, I can deduct $125 from $101? So I don't have to pay tax on $101 (?) and can I carry over $24 for next year or able to deduct from other interest income that I have from other sources.

2. Do I need to calculate accrual part of income that I have NOT received (from 10/1/22-12/31/22). i.e. Income earned but not received in cash.

thanks
[/QUOTE]

1. Here is what IRS pub 550 says:

[QUOTE]
Accrued interest on bonds.

If you received a Form 1099-INT that reflects accrued interest paid on a bond you bought between interest payment dates, include the full amount shown as interest on the Form 1099-INT on Schedule B (Form 1040), Part I, line 1. Then, below a subtotal of all interest income listed, enter “Accrued Interest” and the amount of accrued interest you paid to the seller. That amount is taxable to the seller, not you. Subtract that amount from the interest income subtotal. Enter the result on line 2b of Form 1040 or 1040-SR.
[/QUOTE]

It doesn't address your question directly, but I think as long as you don't end up with a negative total on Schedule B you will be fine. If you prefer, you could deduct only 101 of it, and deduct the rest in the following tax year.

2. No. You only pay tax on stated interest (i.e., coupon payments) for the tax year received.

You can search this thread for "accrued interest" to see discussions we've already had about it.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Tax implication of coupon vs gain through treasury bonds
			I suggest you post your questions in this thread: Taxation of Treasury bills, notes and bonds - Bogleheads.org.

Your questions may already be answered there. If not, post it there. We could even ask a moderator to merge this thread into that thread if you'd like.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: AAA wrote: Wed Jan 18, 2023 10:55 am]
AAA wrote: Wed Jan 18, 2023 10:55 am
This is a lot to absorb for the uninitiated and my questions no doubt have already been covered but it's quite confusing so maybe it will help others also.

I have purchased only Treasury Notes at discount last year (2022). Some matured during 2022. I understand that the purchase price included some prorated interest that was due to the seller at the time of purchase.

o Does the 1099-INT Box 1 interest reported by the brokerage (Vanguard, Fidelity) already take the interest paid to the seller into account or do I subtract it out before entering the amount in the tax program?
[/QUOTE]
Tax software lets you make an adjustment for accrued interest. It is reported by the broker in the year of purchase in a supplemental section of the composite 1099. You make the adjustment in the year of the first coupon payment, so don't forget about the accrued interest if the first coupon payment is not in the year of purchase.

[QUOTE]
o Since the redemption price is > the purchase price, will I also receive a 1099-B? My understanding is that the gain is considered part of the interest earned so I don't think I will get one, but if I do how do I handle it in the tax program if it's not a capital gain?
[/QUOTE]
This is explained in the OP:

[QUOTE]
Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.
[/QUOTE]

[QUOTE]
o I'll be using H&R Block's downloaded program. From your experience, will its interview questions take all this into account for me without my having to do any calculations?
[/QUOTE]
If you search the thread for the topic of interest, e.g., "accrued market discount", I think you'll find your answers. If you sell before maturity, you'll have to do a calculation to figure out what is accrued market discount (taxed as interest) and what is cap gain.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			To the posters whose threads were merged into this thread: please read the OP and the links that are relevant to your questions. If still not answered, try a search within the thread for the topic of interest; e.g., "accrued interest". If none of that answers your questions, please reply with any remaining questions.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Secondary Market Treasury Taxation  Questions
			Please see this thread: Taxation of Treasury bills, notes and bonds. Your questions should be answered there. If not, you can post whatever you still don't understand in that thread if you want.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Bcdkgf wrote: Wed Jan 04, 2023 12:31 pmKevin M wrote: Wed Jan 04, 2023 12:00 pmBcdkgf wrote: Wed Jan 04, 2023 6:31 am]
Bcdkgf wrote: Wed Jan 04, 2023 12:31 pm
Kevin M wrote: Wed Jan 04, 2023 12:00 pm
Bcdkgf wrote: Wed Jan 04, 2023 6:31 am
REDEMPTION PAYOUT UNITED STATES TREAS SER BL-2022 0.12500% 12/31/2022 NTS NOTE (Cash)

This matured on Dec 31 (a Saturday). Fidelity is showing the matured value as a short term capital gain for the tax year 2023? Is this correct? I thought the gain would be treated as interest for tax year 2022. I did receive a separate line item for the interest related to this bond for tax year 2023. The bond processed on Jan 3 and shows as sold (Matured)

If it could be treated as a capital gain, I have some short term accrued capital losses so I could negate this gain for tax purposes?

I have to edit this, the interest actually shows up for 2023 tax year.

This is explained in the OP, so you might want to read that carefully. It's covered in the Treasury notes and bonds section. Brief summary: there will be an adjustment on the 1099-B that shows the accrued market discount, which I think will be all of what Fidelity is showing as STCG. Incidentally, I owned the same note at Fidelity, so I see the same things you're seeing.

To clarify, Fidelity is mistakenly showing this as a short term capital gain, but when the 1099B is issued  Fidelity will show as accrued Market discount for tax year 2023, even though the bond matured in 2022?
[/QUOTE]

It's not a mistake, they just aren't showing the adjustment that will appear on 1099-B, and yes, the interest was received in 2023, so cash basis taxpayers report it for 2023.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Bcdkgf wrote: Wed Jan 04, 2023 6:31 am]
Bcdkgf wrote: Wed Jan 04, 2023 6:31 am
REDEMPTION PAYOUT UNITED STATES TREAS SER BL-2022 0.12500% 12/31/2022 NTS NOTE (Cash)

This matured on Dec 31 (a Saturday). Fidelity is showing the matured value as a short term capital gain for the tax year 2023? Is this correct? I thought the gain would be treated as interest for tax year 2022. I did receive a separate line item for the interest related to this bond for tax year 2023. The bond processed on Jan 3 and shows as sold (Matured)

If it could be treated as a capital gain, I have some short term accrued capital losses so I could negate this gain for tax purposes?

I have to edit this, the interest actually shows up for 2023 tax year.
[/QUOTE]

This is explained in the OP, so you might want to read that carefully. It's covered in the Treasury notes and bonds section. Brief summary: there will be an adjustment on the 1099-B that shows the accrued market discount, which I think will be all of what Fidelity is showing as STCG. Incidentally, I owned the same note at Fidelity, so I see the same things you're seeing.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Music Teacher Tim wrote: Mon Dec 19, 2022 2:50 pm]
Music Teacher Tim wrote: Mon Dec 19, 2022 2:50 pm
That's what I was hoping.  In a case like that, I guess the difference in the issue price and the secondary market price would be the cap gain or loss for the broker, not the buyer.  I was somehow thinking the whole chain of events ended up in my lap, but all I should be concerned with is the profit (interest) I made.  And I guess if I were to sell a T-Bill before maturity, I would deal with the gain or loss, but not the next buyer.  I'm just repeating back to see if I'm wrapping my head around this right.  Thanks.
[/QUOTE]

The broker is just the intermediary. Whoever sells the bill deals with any accrued acquisition discount and capital gain/loss upon the sale. You start fresh as of the settlement date. It doesn't matter what the price at issue was.

If you sell bills before maturity, you will need to figure out how much of the earnings is cap gain/loss and how much accrued acquisition discount. Typically most will be the latter, but some may be the former.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Music Teacher Tim wrote: Mon Dec 19, 2022 9:19 am]
Music Teacher Tim wrote: Mon Dec 19, 2022 9:19 am
Excellent topic. If a T-Bill is purchased in the secondary market from a broker, the price paid to the broker will be either more or less than the price the Bill was originally issued at. So, aside from paying tax on the interest income at maturity, does the price difference in what you paid the broker and the original issue price become a cap gain or loss? For example, let's say a T-Bill was sold at auction for 97.50, the "interest" would be 2.50. But if I paid 98.00 for that Bill from a broker, I would still get 100.00 at maturity, so my "interest" would be 2.00. So do I then have a cap loss of 0.50? Or, is all of this accounted for on the broker's end, and all I have to worry about is the price to the broker?.
[/QUOTE]

No cap gain or loss if held to maturity. The accrued acquisition discount is taxed as interest in the year of maturity. It doesn't matter whether the bill is acquired at auction or on secondary.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Naive Treas Bill Question
			
[QUOTE: boater07 wrote: Mon Dec 05, 2022 11:39 am]
boater07 wrote: Mon Dec 05, 2022 11:39 am
[Thread merged into here --admin LadyGeek]

When I cash in some bills at maturity, can I treat that as a CG or will it be reported as interest?
[/QUOTE]

This is answered in the OP:

[QUOTE: Kevin M wrote: Tue Nov 15, 2022 7:26 pm]
Kevin M wrote: Tue Nov 15, 2022 7:26 pm

[/QUOTE]

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: protagonist wrote: Wed Nov 30, 2022 9:41 pm]
protagonist wrote: Wed Nov 30, 2022 9:41 pm
Thank you for doing this, Kevin.

I only own TIPS, no nominal Treasuries, and have purchased them all via Fidelity via the secondary market.

Perhaps I am hoping for too much, but I am hoping that all the information necessary will be clearly marked on Fidelity's end of year tax documents (1099s), and standard tax software (like H+R Block or Turbotax) will make it easy to enter the information in the appropriate places.

Am I correct, or will this be more complicated?
[/QUOTE]

You're welcome!   

Well, that's why we have this thread. I have not done a tax return with TIPS involved, so can't speak from experience. I will be doing several of them for 2022.

My understanding is that the inflation adjustments should be reported on 1099-OID, and perhaps the stated interest as well, but someone with actual experience can chime in.

There might have been a potential issue with the accrued market discount (and/or OID) not being reported correctly on 1099-OID in the past (cue #Cruncher), but I don't know if that's still the case with covered securities. If it is still an issue, we will have fun sorting it out here.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: GaryA505 wrote: Mon Nov 28, 2022 9:07 amHueyLD wrote: Mon Nov 28, 2022 8:28 amGaryA505 wrote: Mon Nov 28, 2022 7:54 am]
GaryA505 wrote: Mon Nov 28, 2022 9:07 am
HueyLD wrote: Mon Nov 28, 2022 8:28 am
GaryA505 wrote: Mon Nov 28, 2022 7:54 am
When does the January auction start?

https://home.treasury.gov/system/files/ ... hedule.pdf

Perfect. So it looks like Jan 24 for the 52-week.

Edit: I see that you would probably want to put your order in on Jan 19, correct?
[/QUOTE]

Yes, the auction is scheduled to be announced on Jan 19, so probably will show up as available to buy then. Auction on 24th, issue on 26th. As long as you get your order in before the 24th, you'll be fine.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: GaryA505 wrote: Sun Nov 27, 2022 11:36 pm]
GaryA505 wrote: Sun Nov 27, 2022 11:36 pm
If buying Treasuries in Jan 2023, the only way to avoid any taxable income in 2023 is buying TBills at auction and hold until maturity in 2024?
[/QUOTE]

I can't think of why you'd need to buy them at auction. If you buy Tbills on secondary in Jan 2023 that mature in Jan 2024, and you hold until maturity, no interest is reported until Jan 2024.

But, it probably makes sense to buy them at auction. The Jan 2023 52-week bill auction settles on Thursday, Jan 26. You could buy them on secondary on Thursday, Friday, or Monday, and have settlement in Jan 2023, but why bother?

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Individual bond purchases and tax loss harvesting
			
[QUOTE: Artsdoctor wrote: Fri Nov 25, 2022 8:17 amny10036 wrote: Wed Nov 23, 2022 9:26 pm]
Artsdoctor wrote: Fri Nov 25, 2022 8:17 am
ny10036 wrote: Wed Nov 23, 2022 9:26 pm
[Thread merged into here --admin LadyGeek]

Hi.

From what I've read, it seems tax loss harvesting with equities can only be applied to offset capital gains and NOT dividends.

Can it be applied to offset gains from the sale of a bond with a coupon before its maturity?

In viewtopic.php?p=6974605, I discovered that hypothetical, accrued interest is included in the sale price of a treasury bond before it matures.

Extending on that example, let's say I purchased one unit of 1 year treasury notes with 2% yield on the date it was issued for $1000. Then some days before it matures, let's say I manage to sell it for $1019.

For tax purposes, is this a capital gain that can be offset with capital losses? Or is this still considered a dividend?

If you purchased a note at par and sell it at 1.019, you'll have a capital gain.  You'll also have interest from the coupon.  The interest from the coupon(s) will be taxable at the federal level but not the state level; the gain can be offset by any other losses you might have but if you have no losses, the gain will be taxable at both federal and state levels (if you live in a state with personal income tax).
[/QUOTE]

To further clarify, accrued interest is not hypothetical--you actually own it, and when you sell you get it from the buyer. Accrued Treasury interest is taxed like any other Treasury interest, and is reported by the broker in box 3 of 1099-INT for the year of sale.

Accrued interest is broken out in a section not reported to the IRS. Here's how Schwab did it in 2019:

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Merry wrote: Wed Nov 23, 2022 11:59 amKevin M wrote: Mon Nov 21, 2022 1:55 pmMerry wrote: Mon Nov 21, 2022 1:40 pmKevin M wrote: Mon Nov 21, 2022 1:05 pm]
Merry wrote: Wed Nov 23, 2022 11:59 am
Kevin M wrote: Mon Nov 21, 2022 1:55 pm
Merry wrote: Mon Nov 21, 2022 1:40 pm
Kevin M wrote: Mon Nov 21, 2022 1:05 pm
I don't know why the short-term capital gains were shown in a section not reported to the IRS, and not on 1099-B. Nevertheless, you are required to enter the info into form 8949, which the tax software does for you if you enter the info appropriately. In doing this, you handle the accrued acquisition discount so it shows up as interest on Schedule B, and the remainder is short-term capital gain reported on 8949 and Schedule D.

Kevin

Am I understanding this correctly to mean the only amount that would show up on the accrued acquisition discount for interest on Schedule B would be from other Tbills that went to maturity AND all of the gains from a Tbills sold before maturity would go toward short term capital gains on 8949 and Schedule D? Would those short term capital gains not be exempt from state tax as it is being reported on Schedule D vs Schedule B? Or does that not matter because it’s still linked to an obligation of the federal government and so if a state exempts such income then state taxes wouldn’t be owed on those short term capital gains?

The last question is a main point that has not been resolved with certainty for all states. We have seen inputs that accrued acquisition discount seems to be deductible for some states.

I wouldn't worry too much about exactly where things are reported. The bottom line is that accrued acquisition discount is reported as interest on Schedule B, regardless of what 1099 form or supplemental section it's reported on/in. If there is any gain in addition to the accrued acquisition discount, it is reported on form 8949 and Schedule D.

Kevin

I was linking the Schedules used in my mind because for the accrued acquisition discount for Tbills that mature, and Tnote coupon and accrued market discount, that all is reported with Schedule B. The Tbills sold before maturity are reported with Schedule D and that in my mind was triggering the question of whether that was somehow a capital gain that we couldn’t link to a government obligation. But from your answer I think you’re saying the Schedule isn’t relevant to the state tax question. So would it be fair to say that if I am going to interpret what my state says as not taxing government obligations then it would not matter Tbill or T note held to maturity or sold before maturity, it’s all government obligation so I would use that as my justification of not state taxable? The only difference is what forms I need to use to report it? Thanks for the discussion.
[/QUOTE]

If you hold a bill to maturity, the accrued acquisition discount is reported by the broker as interest in box 3 of form 1099-INT, which flows to Schedule B. It also might be reported on 1099-B, but if so, the basis and proceeds are the same, so no gain or loss.

Selling the bill before maturity is what results in the supplemental 1099 info for reporting on form 8949 and Schedule B.

Note and bond coupon payments are included in 1099-INT box 3 USGO interest.

Regarding your question, if you sell before maturity, accrued market or acquisition discount ends up on Schedule B, but there could still be some capital gain or loss that ends up on Schedule D.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			^Thanks for sharing that.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Selling T Bill before maturity tax implications
			
[QUOTE: curmudgeon wrote: Tue Nov 22, 2022 5:32 pmTubes wrote: Tue Nov 22, 2022 12:32 pm]
curmudgeon wrote: Tue Nov 22, 2022 5:32 pm
Tubes wrote: Tue Nov 22, 2022 12:32 pm
It is one reason I like to buy Bills at Auction and hold to maturity.  Easy peasey.

After running into some of this tax messiness one year, I decided to limit my holdings on the taxable side to CDs, tbills, and funds which have simpler tax reporting.  I buy secondary market bonds only in tax deferred accounts.  This requires a bit of adjustment in how I manage our holdings, but it makes tax filing easier.
[/QUOTE]

Since this thread is intended to help people with their tax reporting, would you mind sharing the tax reporting difficulties you encountered?

It is not an issue for bills bought on secondary if you hold to maturity--all accrued acquisition discount (aka interest) is reported in box 3 of 1099-INT. There are only complications if you sell before maturity.

For notes and bonds sold before maturity, accrued market discount and adjusted capital gain or loss is shown either on 1099-B or in a supplemental 1099 section, so in a way tax reporting is easier for notes and bonds sold before maturity than bills sold before maturity.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Selling T Bill before maturity tax implications
			
[QUOTE: dan916 wrote: Tue Nov 22, 2022 12:13 pm]
dan916 wrote: Tue Nov 22, 2022 12:13 pm
sounds like even if I sell it its interest, but I would need to adjust it on my own return.  The brokerage will not classify it.  Sounds like PIA
[/QUOTE]

Part of it is interest and part short-term capital gain. I needed to figure out the interest part, but it wasn't that that complicated. It does take more work than just plugging numbers from a 1099 into tax software.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: 50/50 wrote: Tue Nov 22, 2022 9:54 am]
50/50 wrote: Tue Nov 22, 2022 9:54 am
cas wrote:

"Complication 2:  Figuring out what year's tax return to do all of the above upon.

The IRS doesn't want you subtracting the "accrued interest paid to seller" from your income until the tax year when you actually received the 6 months worth of interest to which it corresponds."

cas: Thank you for your post. Your explanation is much clearer than Pub. 550. I have noted on my purchases which year I should report the accrued interest. You probably saved me from making a reporting error. Much obliged.

Regards, 50/50
[/QUOTE]

I used a CPA one year, and he included all of the accrued interest paid in that tax year, even though some of the Treasuries didn't pay interest in that tax year. He made lots of other mistakes which I corrected, but I let this one slide, and never got a correction notice from the IRS. I did get a correction notice from the CA FTB with respect to another mistake he made that I had called out, but that he didn't change.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Electron wrote: Mon Nov 21, 2022 3:50 pm]
Electron wrote: Mon Nov 21, 2022 3:50 pm
Thanks all for the comments on the subject of Accrued Market Discount and any exemption for the state income tax. I just checked the Vanguard document that reports U.S. Government Income for 2021.
 
The Short Term, Intermediate Term, and Long Term Treasury Index funds all reported 100% of income from U.S. Government obligations. These funds would have had some amount of Accrued Market Discount and it is not being reported to shareholders. If any states intended to tax Accrued Market Discount with Treasury securities they would need reporting by mutual funds. This makes me feel a lot better about the situation.
[/QUOTE]

I raised the exact same argument in the thread in which this discussion started!

[QUOTE: Kevin M wrote: Sat Nov 12, 2022 1:45 pmmsimon wrote: Sat Nov 12, 2022 10:44 amKevin M wrote:]
Kevin M wrote: Sat Nov 12, 2022 1:45 pm
msimon wrote: Sat Nov 12, 2022 10:44 am
Kevin M wrote:Here's a puzzle I'm left with. For tax year 2021, income distributions from both Vanguard intermediate-term and long-term Treasury index funds were 100% USGO, so 100% exempt from state income tax. The only non-income distribution was a long-term capital gain distribution. So I don't see any distributions that would account for accrued market discount. Here is a relevant footnote from the annual report for the int-term T index fund:
6. Other: Interest income includes income distributions received from Vanguard Market Liquidity
Fund and is accrued daily. Premiums and discounts on debt securities are amortized and accreted,
respectively, to interest income over the lives of the respective securities, except for premiums on
certain callable debt securities that are amortized to the earliest call date. Security transactions are
accounted for on the date securities are bought or sold. Costs used to determine realized gains
(losses) on the sale of investment securities are based on the average cost of the securities sold.
So as I understand it, discounts are accreted and included in interest income, which according to Vanguard literature is 100% USGO income.

Can you explain this?

Hi Kevin,

I don't know - it's a good question. I guess the question is how often will these funds be getting significant incoming cash flows that they must invest in bonds with large market discounts without buying an offsetting amount of bonds with amortizing premiums. If most of the cash flows that the funds have to invest are invested in new issues at auction there won't be too much market discount. If you think of a bond fund as being similar to a bond ladder assuming a stable AUM the fund most likely just invests in the longest maturity new issues as other  bonds mature. A sudden increase in AUM would force a buying across a spectrum of maturities and be more likely to result in the purchase of bonds with significant market discounts. 

Good thought, but I don't think so. From memory, I recalled that turnover rate for bond funds is surprisingly high. Checking VSIGX, it was 59% for the year ending August 31, 2022. 

There were only 12 auctions of 10-year notes in the year ending 9/30/2022, including reopenings, so I don't think we can assume that the bond fund works just like a rolling ladder nor that they buy only at auction; they appear to be buying and selling bonds on the secondary market, probably daily. 

Note that at the most recent reopening of the 10-year on 10/12/2022, the price was 90.449122; this was originally auctioned on 08/10/2022 at a price of 99.956556. So even issues bought at reopenings can be quite heavily discounted.

I downloaded the holdings as of 9/30/2022, pulled in yield quotes for Treasuries from Fidelity, and calculated the prices based on a 9/30/2022 settlement date. 

Just glancing at the first row, for a 7/31/2029 issue, coupon rate is 2.625%. We know Treasury yields are in the 4% ballpark, so this note/bond must be priced at a discount.

Average coupon rate for the fund is 2.16%, avg yield is 4.01%, and average price is 91.78. There are only 13 bonds priced at a premium (>100) out of 109 bonds in the fund.

I agree that calling Vanguard probably is pointless. I've tried before to get answers to detailed questions about bond fund numbers, and never have gotten an answer that actually answered my question. It answered a bunch of questions I didn't ask.

So, if accrued market discount is taxed as ordinary income, market discounts are accreted to income, and close to 100% of income is from USGO, we still have a bit of a mystery here.

Kevin
[/QUOTE]

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			^Thanks!

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Merry wrote: Mon Nov 21, 2022 1:40 pmKevin M wrote: Mon Nov 21, 2022 1:05 pm]
Merry wrote: Mon Nov 21, 2022 1:40 pm
Kevin M wrote: Mon Nov 21, 2022 1:05 pm
I don't know why the short-term capital gains were shown in a section not reported to the IRS, and not on 1099-B. Nevertheless, you are required to enter the info into form 8949, which the tax software does for you if you enter the info appropriately. In doing this, you handle the accrued acquisition discount so it shows up as interest on Schedule B, and the remainder is short-term capital gain reported on 8949 and Schedule D.

Kevin

Am I understanding this correctly to mean the only amount that would show up on the accrued acquisition discount for interest on Schedule B would be from other Tbills that went to maturity AND all of the gains from a Tbills sold before maturity would go toward short term capital gains on 8949 and Schedule D? Would those short term capital gains not be exempt from state tax as it is being reported on Schedule D vs Schedule B? Or does that not matter because it’s still linked to an obligation of the federal government and so if a state exempts such income then state taxes wouldn’t be owed on those short term capital gains?
[/QUOTE]

The last question is a main point that has not been resolved with certainty for all states. We have seen inputs that accrued acquisition discount seems to be deductible for some states.

I wouldn't worry too much about exactly where things are reported. The bottom line is that accrued acquisition discount is reported as interest on Schedule B, regardless of what 1099 form or supplemental section it's reported on/in. If there is any gain in addition to the accrued acquisition discount, it is reported on form 8949 and Schedule D.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Merry wrote: Mon Nov 21, 2022 12:38 pmKevin M wrote: Sat Nov 19, 2022 3:03 pmKookaburra wrote: Fri Nov 18, 2022 11:09 pm]
Merry wrote: Mon Nov 21, 2022 12:38 pm
Kevin M wrote: Sat Nov 19, 2022 3:03 pm
Kookaburra wrote: Fri Nov 18, 2022 11:09 pm
If one buys a Tbill and sells on the secondary market before maturity, how do they know how much of the price discount left is interest vs capital gain/loss?

You can read about this in IRS pub 550:
Discount on Short-Term Obligations

When you buy a short-term obligation (one with a fixed maturity date of 1 year or less from the date of issue), other than a tax-exempt obligation, you generally can choose to include any discount and interest payable on the obligation in income currently. If you do not make this choice, the following rules generally apply.

You must treat any gain when you sell, exchange, or redeem the obligation as ordinary income, up to the amount of the ratable share of the discount. See Discounted Debt Instruments, later. 
You can follow the link to see the methods that can be used to determine the ratable share of the discount. 

When I sold bills before maturity in 2019 at Schwab, they reported the proceeds as short-term capital gain in the year end summary, not provided to the IRS on 1099-B. I have a spreadsheet in which I calculated the accrued acquisition discount, which I reported as interest, with the remainder being short-term capital gain. I'd have to fire up my 2019 HR Block software to see the details of exactly how I entered all of this.

Kevin

This is an immensely helpful thread- thank you to all for sharing your knowledge! Kevin, you sold a Tbill before maturity, why wouldn’t Schwab report it on 1099-B? When I asked Fidelity they informed me they’d report Tbills held to maturity as interest and Tbills sold before maturity as capital gains. I’m trying to interpret the IRS pub 550 section Kukkaburra shared, and am confused about the reference to ordinary income? I’ve read the entire thread and may have missed the straightforward answer- what should happen during the early sale of a secondary Tbill - what form and boxes should the brokerages send to the IRS and us? Thanks again!
[/QUOTE]

I don't know why the short-term capital gains were shown in a section not reported to the IRS, and not on 1099-B. Nevertheless, you are required to enter the info into form 8949, which the tax software does for you if you enter the info appropriately. In doing this, you handle the accrued acquisition discount so it shows up as interest on Schedule B, and the remainder is short-term capital gain reported on 8949 and Schedule D.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: MikeG62 wrote: Sun Nov 20, 2022 6:21 amKlewles wrote: Sun Nov 20, 2022 4:13 amElectron wrote: Sat Nov 19, 2022 1:28 pm]
MikeG62 wrote: Sun Nov 20, 2022 6:21 am
Klewles wrote: Sun Nov 20, 2022 4:13 am
Electron wrote: Sat Nov 19, 2022 1:28 pm
If the state tax exemption on accrued market discount is an issue in some states, I assume one could buy Treasuries selling at a premium instead. The coupon interest would generally be higher but the premium or amortized premium would be subtracted on Schedule B.

+1.  That would seem to make it certain that all interest is excludable from state income. Furthermore, my experience is that Turbotax handles it correctly for both Federal and my state (CA) without any fuss, because the 1099-INT breaks out Treasury interest (box 3) and Treasury premium (box 12), allowing TT to make the correct calculation.

I'm surprised that the state tax exemption is an issue as one can often buy a Treasury at a discount or premium with similar yield-to-maturity.

It's an issue because in some states -- e.g., CA -- tax law is silent on what defines excludable Treasury interest. If I understand correctly, Federal law says that interest paid by Treasury is not taxable by any state.  But market discount is not paid by Treasury, it's "paid" by the seller, so we're left to guess whether CA law regards it as taxable or not.  I won't try to argue that it is or is not taxable -- the issue is that we have to argue it because CA law is silent.  To avoid the issue, buy at a premium.

That's fine in theory, but maybe harder to execute in practice.  More specifically, I am not sure one could find Treasuries selling at a premium in today's market, or if one could they would be very few and far in between.  To do so, the coupon on that bond would have to be above the market interest rates for comparable term Treasuries.  As an example, I've bought a crap ton of Treasuries in the secondary market this year with remaining maturities ranging from 3 months to 20 years and lots in between. I don't recall ever spotting one selling at a premium.
[/QUOTE]

They exist, but most are priced at a discount.

The problem with the high-price issues is that they have a high coupon, and for whatever reason may have a yield well below other Ts at same or similar maturity. Example: I see a price of 100.923 for 2/15/2023, with ask yield of 3.09%. There is a 2/15/2023 note with a yield of 4.25% (and price 99.475). I would not buy the lower yield just to avoid dealing with market discount, but maybe this is part of the reason the high-coupon yield is lower.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Kookaburra wrote: Fri Nov 18, 2022 11:09 pm]
Kookaburra wrote: Fri Nov 18, 2022 11:09 pm
If one buys a Tbill and sells on the secondary market before maturity, how do they know how much of the price discount left is interest vs capital gain/loss?
[/QUOTE]

You can read about this in IRS pub 550:

[QUOTE]
Discount on Short-Term Obligations

When you buy a short-term obligation (one with a fixed maturity date of 1 year or less from the date of issue), other than a tax-exempt obligation, you generally can choose to include any discount and interest payable on the obligation in income currently. If you do not make this choice, the following rules generally apply.

You must treat any gain when you sell, exchange, or redeem the obligation as ordinary income, up to the amount of the ratable share of the discount. See Discounted Debt Instruments, later.
[/QUOTE]

You can follow the link to see the methods that can be used to determine the ratable share of the discount. 

When I sold bills before maturity in 2019 at Schwab, they reported the proceeds as short-term capital gain in the year end summary, not provided to the IRS on 1099-B. I have a spreadsheet in which I calculated the accrued acquisition discount, which I reported as interest, with the remainder being short-term capital gain. I'd have to fire up my 2019 HR Block software to see the details of exactly how I entered all of this.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Fri Nov 18, 2022 9:24 pm]
HereToLearn wrote: Fri Nov 18, 2022 9:24 pm
One more question.  If I pay $48,000 for a Treasury with a 3% coupon, is the coupon payment calculated on the $48K purchase price or the $50K redemption price?

My continuing to say thanks seems wholly inadequate but I greatly appreciate your patience with this beginner.
[/QUOTE]

The point of this thread is to help everyone understand the topic, whatever their level of current understanding, so you're welcome!

Interest is calculated on the face value, which is $50K in your example.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Fri Nov 18, 2022 4:47 pm]
HereToLearn wrote: Fri Nov 18, 2022 4:47 pm
This thread prompted me to pull down the transaction sheets and enter the info in Excel, but it needs more automation.

Can you explain this: "I calculate a principal amount value by subtracting accrued interest from Amount, and populate a cell in the Principal amount column with this value."

It may be that I am going about this backwards, but I recorded the amount of accrued interest and subtracted that figure from the paid or payable interest to know the amount of interest that I would be taxed on.  What is the principal amount used for?

This will start being clearer as more of these Treasuries start to redeem and/or pay interest.
[/QUOTE]

Not sure what you mean by "recorded", because the accrued interest is in the download file, so should be in the Excel sheet you import it to.

For your purpose, you would subtract the accrued interest from the semi-annual coupon amount to determine the amount of interest you'll owe tax on. 

I populate a coupon rate cell with this formula:

Code: Select all=VALUE(MID($E123,FIND("%",$E123)-7,8))

where cell E123 contains Description.

You can then divide this by half and multiply by the face value of your holding to get the semi-annual coupon payment amount. Then add a column to show semi-annual interest minus accrued interest as the interest you will be taxed on. I'm not currently calculating this, but I might add it to help with income projections for 2022 tax purposes.

I use principal amount to see how much I'm paying excluding the accrued interest, so I can compare these numbers for multiple purchases of the same security. This may be of no interest to you.

I get other things from description, like maturity date with this formula:

Code: Select all=VALUE(MID($E123,FIND("/",$E123)-2,10))

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Groundhog wrote: Fri Nov 18, 2022 2:35 pmBlues wrote: Fri Nov 18, 2022 10:51 am]
Groundhog wrote: Fri Nov 18, 2022 2:35 pm
Blues wrote: Fri Nov 18, 2022 10:51 am
Well, I hope FreeTaxUSA is capable of handling these scenarios or I'm going to lament having gone down this route...(and probably change back to TurboTax which I gave up using several years ago).   All of my purchases, (bills and notes), have been on the secondary market. 

If you hear a bloodcurdling scream in a few months, you'll know where it came from.

I use FreeTaxUSA also (2022 is open now). I just logged into my account and went to the 1099-INT input screen and there is a box to enter Accrued Interest. I don’t know how it flows from there but it appears to be handled by FreeTaxUSA. 

I dipped into the Treasury market this year myself. Most have been auctions but several were on the secondary market.
[/QUOTE]

Accrued interest and accrued market discount are different things, but you're in good company, because I recently conflated them in discussing how accrued market discount was shown on 1099s.

For bills neither of these is relevant, because there is no accrued interest or accrued market discount with them. These items are only relevant for notes and bonds.

Accrued market discount is not reported on 1099-INT, unless perhaps if you've elected to report income in the year received (I have no experience with that). Unless you make this election, accrued market discount is included in box 1f of 1099-B for the year of disposition, and must be handled as we've discussed.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Fri Nov 18, 2022 1:37 pmKevin M wrote: Fri Nov 18, 2022 12:56 pmHereToLearn wrote: Thu Nov 17, 2022 9:25 pm]
HereToLearn wrote: Fri Nov 18, 2022 1:37 pm
Kevin M wrote: Fri Nov 18, 2022 12:56 pm
HereToLearn wrote: Thu Nov 17, 2022 9:25 pm
Kevin---Thank you for starting this thread.  I will be following closely as this has been my first year purchasing Treasury bills and notes.

I understand that I am supposed to subtract the accrued interest that I paid the seller in order to determine how much income I need to report.  Is there any way to obtain this info before the 1099 is produced?  

I am asking because I am trying to project my tax liability for this year before the end of the year.

Many thanks.

Which broker? Fidelity and Vanguard include accrued interest in your transaction history, which you can download. Schwab probably does too, but I haven't been using them this year.

I download my Treasury transactions on the day of purchase at Fidelity, and the next trading day at Vanguard, and import them into a Treasury Trades spreadsheet. I see the accrued interest there.

Kevin

Thanks!  

It is at Fidelity.  Editing AGAIN to say that I found the confirmation statements, so I guess my only remaining question is about the Treasury Trades spreadsheet.

Is a Treasury Trades spreadsheet something you created for yourself or is that a Fidelity tool?  

I can easily subtract the amount of interest at purchase from the interest that posted to the account on Nov 15th, and maintain my own spreadsheet but I sense there is a more automated approach.

As always, thank you for your help in educating the uninformed!
[/QUOTE]

I created a Google Sheets spreadsheet to track my Treasury trades. It supports imports from Fidelity and Vanguard transaction downloads--they use different formats, so formulas are required to unify them for tracking and analysis. If just dealing with one broker, it's much easier.

I'm buying Treasuries in multiple accounts at Fidelity, so I first click All accounts, then Activity & Orders. History is selected by default, but if not, select it.
In Time Period enter the time period of interest. I enter today or sometimes today and yesterday to get just the most recent transactions. You would enter a large enough time period to get all of your transactions. I believe the maximum is 90 days, so you may have to do more than one download if your transactions are older than that. If there are non-trade monetary transactions, I change All Transactions to Investment Activity.
I then click the small Download link above the Amount column, and save to a file, using the default filename of Accounts_History.
I then import this to Google sheets into a temp sheet, then copy/paste just the transactions rows of interest into a Fidelity transactions sheet. This will show you accrued interest, price, etc. 
I calculate a principal amount value by subtracting accrued interest from Amount, and populate a cell in the Principal amount column with this value.
Price is only downloaded with 3 decimal places, but amount is calculated using many more decimal places, so I calculate the actual price from principal amount, quantity, and inflation factor, which also is included in the download.
There are a number of other columns I populate with results from formulas; e.g., settlement date, maturity date, yield, etc.
In other sheets I consolidate the Fidelity and Vanguard transactions, show just TIPS transactions, show holdings, etc.

This all takes me about five minutes. I still have to do it for the TIPS I bought today.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Fri Nov 18, 2022 10:34 amKevin M wrote: Thu Nov 17, 2022 4:02 pmmoneyflowin wrote: Thu Nov 17, 2022 3:46 pm]
cas wrote: Fri Nov 18, 2022 10:34 am
Kevin M wrote: Thu Nov 17, 2022 4:02 pm
moneyflowin wrote: Thu Nov 17, 2022 3:46 pm

For all types of bonds (including Treasuries, corporates, CDs, etc), the easiest thing from a tax perspective is to buy only new issues that are non-callable and hold until maturity.  If one does that, the tax reporting is straightforward

Right, but I'm not going to let the tax tail wag the portfolio construction dog.

[. . .]

If all you do is buy at auction and hold to maturity, you probably aren't very interested in this thread.

A gentle request to anyone who *is* reading this thread and is also reading other threads, elsewhere on the Boglehead's forum,  created by some newbie inquiring about purchasing treasuries or brokered CDs for the first time:

The free tax preparation services available to older and low/moderate income taxpayers apparently can't handle many of the tax items associated with owning secondary treasuries (i.e. they'll tell you they can't do your return).  This has already come up at least once on the forum:  Question for those who volunteer to do income taxes. My father bought a secondary treasury at Fidelity can your software handle that ok?

For anyone reading this thread who is tempted to tell a newbie on some other thread "Jump on in to buying Treasuries on the secondary market! The water is great!" ...  before you do,  PLEASE

Ask them whether they are buying in a taxable or tax sheltered account.

If they are buying in taxable account, ask them how they usually do their taxes.

If buying on the secondary market is going to disqualify someone from using their accustomed free Tax Aide (over 50 years old) or VITA (low to moderate income) help, and toss them into using a paid tax preparer instead, I really doubt the financials work out for buying on the secondary market.   (And, if someone is used to having VITA or Tax Aide do their taxes, they may very well be a poor candidate for switching over to using DIY tax software.)

For example, here are some bond taxation items already mentioned on this thread that Tax Aide considers "out of scope":

1099-INT Not in scope for:
Any adjustment is needed to the amount reported on Federal 1099-INT   [e.g. from cas:  accrued interest paid to seller]
Box 10 Market Discount
Box 11,12, 13 Bond Premiums

1099-B Not in scope for:
Box 1f  [e.g. from cas:  accrued market discount]
[/QUOTE]

Thanks for sharing this. I had not thought about it, since I do my own tax returns. I might add this and other useful inputs to the OP at some point, so most key facts are included there.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: cas wrote: Fri Nov 18, 2022 9:38 am]
cas wrote: Fri Nov 18, 2022 9:38 am
The accrued interest paid to seller is NOT on the 1099-INT and will NOT import automatically into your tax software (or be obvious to your paid tax preparer.)  You will have to remember to make a manual adjustment in your tax software (or specifically alert your paid tax preparer). 
[/QUOTE]

Right, but it is included in a supplemental section of the composite 1099 for the year the accrued interest is paid, which as you explain, may not be the same year you bought the Treasury, so you do have to remember this for the following tax year in this case.

[QUOTE: cas wrote: Fri Nov 18, 2022 9:38 am]
cas wrote: Fri Nov 18, 2022 9:38 am
My recommendation:

Pull, from your brokerage website, the brokerage confirmation for each treasury note/bond that you bought on the secondary market
Circle the line item showing the accrued interest paid to seller
Look at the description of the bond (look for what month it was *originally* issued) and write a note on when (month/year) *you* will first receive interest from this treasury
Write a note to yourself reminding yourself what needs to be done with the accrued interest paid to seller
Stick the whole thing in your tax folder for the *appropriate tax year* as a memory jog.
[/QUOTE]

I have just used the accrued interest reported in the supplemental section of the 1099, but I did need to remember to review that for any securities that paid accrued interest in the year purchased but for which a coupon was not received until the following year.

Thanks,

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HereToLearn wrote: Thu Nov 17, 2022 9:25 pm]
HereToLearn wrote: Thu Nov 17, 2022 9:25 pm
Kevin---Thank you for starting this thread.  I will be following closely as this has been my first year purchasing Treasury bills and notes.

I understand that I am supposed to subtract the accrued interest that I paid the seller in order to determine how much income I need to report.  Is there any way to obtain this info before the 1099 is produced?  

I am asking because I am trying to project my tax liability for this year before the end of the year.

Many thanks.
[/QUOTE]

Which broker? Fidelity and Vanguard include accrued interest in your transaction history, which you can download. Schwab probably does too, but I haven't been using them this year.

I download my Treasury transactions on the day of purchase at Fidelity, and the next trading day at Vanguard, and import them into a Treasury Trades spreadsheet. I see the accrued interest there.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: moneyflowin wrote: Thu Nov 17, 2022 3:46 pmKevin M wrote: Thu Nov 17, 2022 12:38 pmLilyFleur wrote: Thu Nov 17, 2022 12:30 pm]
moneyflowin wrote: Thu Nov 17, 2022 3:46 pm
Kevin M wrote: Thu Nov 17, 2022 12:38 pm
LilyFleur wrote: Thu Nov 17, 2022 12:30 pm
My tax returns already exceed 100 pages. 

I am going to be setting up a T-bill ladder soon, through Schwab.

If I hold the T-bills until maturity, will I avoid these complications?  

I do my own taxes, and I'm fine with the usual Schwab brokerage account 1099.

But this...      

Yes. All T-bill interest is reported in box 3 of 1099-INT, USGO interest income. If you hold to maturity, there is no capital gain or loss.

Notes and bonds are a different matter, since there is accrued market discount or amortized bond premium to deal with.

For all types of bonds (including Treasuries, corporates, CDs, etc), the easiest thing from a tax perspective is to buy only new issues that are non-callable and hold until maturity.  If one does that, the tax reporting is straightforward
[/QUOTE]

Right, but I'm not going to let the tax tail wag the portfolio construction dog.

I am buying only TIPS with less than five years to maturity. Can't do that at auction.

I've been buying Treasuries daily with various maturities with settlement the next trade day--can't do that at auction. Tax reporting for bills bought on secondary market and held to maturity is trivial, as all interest (accrued acquisition discount) is reported in box 3 of 1099-INT.

Finally, I might sell before maturity if a better alternative exists at the time.

If all you do is buy at auction and hold to maturity, you probably aren't very interested in this thread.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: LilyFleur wrote: Thu Nov 17, 2022 12:30 pm]
LilyFleur wrote: Thu Nov 17, 2022 12:30 pm
My tax returns already exceed 100 pages. 

I am going to be setting up a T-bill ladder soon, through Schwab.

If I hold the T-bills until maturity, will I avoid these complications?  

I do my own taxes, and I'm fine with the usual Schwab brokerage account 1099.

But this...
[/QUOTE]

Yes. All T-bill interest is reported in box 3 of 1099-INT, USGO interest income. If you hold to maturity, there is no capital gain or loss.

Notes and bonds are a different matter, since there is accrued market discount or amortized bond premium to deal with.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HueyLD wrote: Thu Nov 17, 2022 6:02 am]
HueyLD wrote: Thu Nov 17, 2022 6:02 am
With so many first timers investing in individual treasuries, I expect a tsunami of related tax questions between 2/1 and 4/15/2023.

It may be a good idea for them to start studying IRS Pub 550 and Pub 1212 a few months ahead of time.  Good luck.
[/QUOTE]

I started this thread so we could get a jump on it. We're already seeing daily posts on Treasury tax questions, which is what motivated me to start the thread.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: moneyflowin wrote: Thu Nov 17, 2022 3:47 ammystupidglasses wrote: Wed Nov 16, 2022 6:29 am]
moneyflowin wrote: Thu Nov 17, 2022 3:47 am
mystupidglasses wrote: Wed Nov 16, 2022 6:29 am
This year, I bought a 6-month T-Bill and sold it a few months later, prior to maturity, for a small gain (but $25 less than face value). Vanguard seems to be treating this as a short-term capital gain (rather than as interest). How should I expect this to be treated on my tax return? Interest or capital gain? It is interesting because if it is reported as STCG, then there is no tax owed because it gets absorbed by TLH activity this year. Thank you.

It's both interest and capital gains(loss).  It could be $22 interest and $3 cap gains, or $27 interest and $2 cap loss.  There's a very low likelihood it will be all interest or all cap gains.

You'll have to figure it out yourself (see Pub 550) then make adjustments to Schedule B and Schedule D.  Some tax software might calculate it for you, but I know HR Block doesn't (HR Block is inexpensive for a reason).  Vanguard may issue a 1099B that reports all $25 as s/t capital gains, but it will be wrong.  IME, brokers do not calculate correctly the interest and cap gains if you sell before maturity.  I've always had to figure it out myself

Next year when you do taxes, you'll regret having sold the T-bill before maturity.
[/QUOTE]

It's not that bad. I didn't have any USGO at Vanguard in 2019, but I've shown how Fidelity and Schwab reported it, and I've shared how I handled it in tax software--I use H&R Block. I did own a bunch of individual munis in 2019 too, and there was only 1 case where the amortized bond premium did not match my calculations, and it was close enough not to worry about.

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: Klewles wrote: Thu Nov 17, 2022 2:50 am]
Klewles wrote: Thu Nov 17, 2022 2:50 am
Just to be clear, the example here shows accrued interest, not accrued market discount.  Accrued interest is the portion of the upcoming coupon payment that the buyer pays to the seller when the bond is sold between coupon payment dates.  It is taxable to the seller in the year of the sale and deductible to the buyer in the year of the coupon payment.
[/QUOTE]

To be really clear, the screenshot was to demonstrate that Treasury bill accrued acquisition discount is included in box 3 of 1099-INT, which is what the text preceding the screenshot says. I should've just clipped the screenshot to show this, but showing that it's reported in the same box as accrued interest for notes doesn't hurt our understanding.

[QUOTE]

[/QUOTE]

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: HueyLD wrote: Wed Nov 16, 2022 10:42 amacegolfer wrote: Wed Nov 16, 2022 10:13 ammystupidglasses wrote: Wed Nov 16, 2022 6:29 am]
HueyLD wrote: Wed Nov 16, 2022 10:42 am
acegolfer wrote: Wed Nov 16, 2022 10:13 am
mystupidglasses wrote: Wed Nov 16, 2022 6:29 am
This year, I bought a 6-month T-Bill and sold it a few months later, prior to maturity, for a small gain (but $25 less than face value). Vanguard seems to be treating this as a short-term capital gain (rather than as interest). How should I expect this to be treated on my tax return? Interest or capital gain? It is interesting because if it is reported as STCG, then there is no tax owed because it gets absorbed by TLH activity this year. Thank you.

Most of it should be categorized as interest income. I believe Vanguard will correctly calculate accrued market discount and include it in 1099.

Just to add to Acegolfer’s comment.  The best place to find answer to such questions is IRS Pub 550.  It says:

“ Discount on Short-Term Obligations

When you buy a short-term obligation (one with a fixed maturity date of 1 year or less from the date of issue), other than a tax-exempt obligation, you generally can choose to include any discount and interest payable on the obligation in income currently. If you do not make this choice, the following rules generally apply.

You must treat any gain when you sell, exchange, or redeem the obligation as ordinary income, up to the amount of the ratable share of the discount.”
[/QUOTE]

I have never made any elections other than accepting whatever the broker includes on the 1099s. I think maybe I was supposed to attach something to my return in the first year I ever included any accrued market discount as interest, but I don't recall doing that--it was many years ago though. At any rate, according to the above quote, since I did not make the choice, I go with the defaults, which is what my brokers have reported.

Technically there is no accrued market discount on bills, because they are not considered "market discount bonds" (see Pub 550). The bill discount is referred to in Pub 550 as acquisition discount, and is reported as interest in box 3 of 1099-INT.

[QUOTE]
Government obligations.

For an obligation described above that is a short-term government obligation, the amount you include in your income for the current year is the accrued acquisition discount, if any, plus any other accrued interest payable on the obligation. The acquisition discount is the stated redemption price at maturity minus your basis.
[/QUOTE]

The context of this is that it applies if you have made the election to include accrued market discount in income currently.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: acegolfer wrote: Wed Nov 16, 2022 3:56 amKevin M wrote: Tue Nov 15, 2022 7:26 pm]
acegolfer wrote: Wed Nov 16, 2022 3:56 am
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.

How is this debatable, when 1099-B displayed it as "interest." Shouldn't It be treated just like any "interest" in 1099-INT?
[/QUOTE]

The 1099-B doesn't show it as interest, but as accrued market discount, which is not included in the reported capital gain. The question is whether or not to treat the accrued market discount as Treasury interest, which is reported in box 3 of 1099-INT for stated interest (e.g., coupon payments), or as non-Treasury interest, which is reported in box 1 for "Interest income".

The way I've done this with tax software is to create a dummy 1099-INT and enter the interest in it. You would enter it into either box 1 or box 3 of the dummy 1099-INT, depending on whether or not the accrued interest is exempt from state and local income tax. As I recall, I entered it in box 3. I am a CA resident.

Looking at my 2019 1099s, I see that Schwab and Fidelity report it slightly differently.

Schwab shows the unadjusted basis, and subtracts accrued market discount to get the gain/loss. Fidelity shows the adjusted basis (accrued market discount added to basis), so gain/loss = proceeds - basis.

In any case, you need to make sure your tax software handles it correctly, and that the adjusted basis (cost + accrued market discount) is used to calculate the reported gain/loss. Then you need to do something to get the accrued market discount onto Schedule B, which is what I use the dummy 1099-INT for.

Kevin

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Re: Taxation of Treasury bills, notes and bonds
			
[QUOTE: ruud wrote: Tue Nov 15, 2022 9:15 pmKevin M wrote: Tue Nov 15, 2022 7:26 pm]
ruud wrote: Tue Nov 15, 2022 9:15 pm
Kevin M wrote: Tue Nov 15, 2022 7:26 pm
Treasury bills are the easiest to understand. Say you pay $990 for $1,000 of face value (this is the minimum at a broker). At maturity you'll receive $10,000; $10 of this will be reported as interest in box 3 of 1099-INT for the year of maturity. IRS publications refer to this $10 as accrued acquisition discount. 

I assume you meant $1,000 instead of $10,000 there.

How does this work for Treasury Bills bought late in the year that mature the subsequent year? What year(s) is the interest taxable in?
[/QUOTE]

Thanks! Fixed.

T bill interest is taxable for the year in which the bill is disposed (sold or matured).

---

###  | https://www.bogleheads.org/forum/search.php?author_id=14152&t=390405&sr=posts&start=250

Taxation of Treasury bills, notes and bonds
			The purpose of this thread is to discuss the topic title. This is only relevant to taxable accounts, so if you hold all of your Treasuries in tax-advantaged accounts, this thread isn't relevant.

Let's start by looking at what TreasuryDirect  says about it:

[QUOTE]
What you earn from your Treasury marketable securities is subject to federal tax but is exempt from state and local taxes. This includes:

    interest you earn on notes, bonds, TIPS, and FRNs.
    Bill "interest" (the difference between the price you pay and the face value you get when the bill matures)
    inflation-protection gains or losses you may get during the year for a TIPS

IRS Form 1099 tells the IRS about interest and gains that may be subject to federal tax.
[/QUOTE]

[QUOTE]
You get one 1099 for all your Treasury securities.

The 1099 has different sections for:

    1099 – INT (Shows interest income you received through the year)
    1099 – B (Shows the proceeds you got for maturing securities not purchased at original issue)
    1099 – OID (Only for TIPS: shows any inflation-adjusted increase or decrease in the principal)
[/QUOTE]

Even though I'm quoting TD, I only buy marketable Treasuries from brokers, like Fidelity, Vanguard and Schwab. Brokers provide a consolidated 1099, like TD, and have separate sections for 1099-INT, 1099-OID, and 1099-B. Any examples I use will be from broker 1099s.

Treasury notes and bonds include TIPS, but from now on, I will use Treasury to refer to a nominal (non-TIPS) Treasury, and TIPS to refer to TIPS.

Note that series I and E savings bonds are not marketable Treasuries, so taxation of these is not a topic for this thread.

Let's look at the specifics of each type of Treasury.

Treasury bills are the easiest to understand. Say you pay $990 for $1,000 of face value (this is the minimum at a broker). At maturity you'll receive $1,000; $10 of this will be reported as interest in box 3 of 1099-INT for the year of maturity. IRS publications refer to this $10 as accrued acquisition discount. 

Treasury bill interest (accrued acquisition discount) is exempt from state and local income tax, as is anything reported in box 3 of 1099-INT. All of this is true whether you buy at auction or on the secondary market.

EDIT. Tax reporting for bills sold before maturity is more complicated. For a detailed explanation of how I handled this for a Schwab 1099 using HR Block tax software, see this post: How to report gain/loss and interest for Tbills sold before maturity

Treasury notes and bonds are more complicated because they pay interest semi-annually (coupon payments), and there also can be a market discount or premium when you buy.

The coupon payments are reported on 1099-INT in box 3, which is for Treasury obligation interest. This is exempt from state and local income tax

The market discount or premium is accrued or amortized respectively.

Accrued market discount is reported by the broker as an adjustment to capital gains in box 1f of 1099-B for the year in which the security is disposed of (sold or matures). This accrued market discount is entered as interest by the tax preparer on Schedule B. There is some debate as to whether accrued market discount is exempt from state and local income tax. It may vary by state.

From Pub 550:

[QUOTE]
Market discount bonds.

Report the sale or trade of a market discount bond on Part I or Part II of Form 8949, whichever is appropriate. See the table How To Complete Form 8949, Columns (f) and (g), in the Instructions for Form 8949 to help you figure the amounts to report for a sale or trade of a market discount bond. Use the Worksheet for Accrued Market Discount Adjustment in Column (g) in those instructions to figure the adjusted accrued market discount. Also report the amount of accrued market discount as interest income on Schedule B (Form 1040), line 1, and identify it as “Accrued Market Discount.” See the Instructions for Form 8949 for more information.
[/QUOTE]

One can make an election to report accrued market discount annually instead of at maturity. See IRS Pub 550 for details. From the Pub:

[QUOTE]
Choosing to include market discount in income currently.

You can make this choice if you have not revoked a prior choice to include market discount in income currently within the last 5 calendar years. Make the choice by attaching to your timely filed return a statement in which you:

    State that you have included market discount in your gross income for the year under section 1278(b) of the Internal Revenue Code, and

    Describe the method you used to figure the accrued market discount for the year.

Once you make this choice, it will apply to all market discount bonds you acquire during the tax year and in later tax years. You cannot revoke your choice without the consent of the IRS. See Rev. Proc. 2022-14 for information on how to revoke your election.
[/QUOTE]

Bond premium can be amortized or reported in the year of disposition. From Pub 550:

[QUOTE]
Bond Premium Amortization

If you pay a premium to buy a bond, the premium is part of your basis in the bond. If the bond yields taxable interest, you can choose to amortize the premium. This generally means that each year, over the life of the bond, you use a part of the premium to reduce the amount of interest includible in your income. If you make this choice, you must reduce your basis in the bond by the amortization for the year.
[/QUOTE]

TIPS are inflation-adjusted Treasury notes and bonds. As the TD site says, the inflation adjustment is reported on 1099-OID. This is then reported on Schedule B, along with interest.

I have never done a tax return with TIPS in taxable, so I can't speak from experience on this yet. I will be doing tax returns with TIPS in taxable next year. I assume the real coupon payments are shown on 1099-INT, but maybe they also are reported on 1099-OID; I can't say from experience. From Pub 550:

[QUOTE]
Inflation-Indexed Debt Instruments

If you hold an inflation-indexed debt instrument (other than a Series I U.S. savings bond), you must report as OID any increase in the inflation-adjusted principal amount of the instrument that occurs while you held the instrument during the year. In general, an inflation-indexed debt instrument is a debt instrument on which the payments are adjusted for inflation and deflation (such as Treasury Inflation-Protected Securities). You should receive Form 1099-OID from the payer showing the amount you must report as OID and any qualified stated interest paid to you during the year. For more information, see Pub. 1212.
[/QUOTE]

EDIT: Here is a link to a reply in which I verify the OID reported by Vanguard for TIPS, and share how it was handled by H&R Block tax software for 2022: Verification of OID reported by Vanguard for TIPS.

STRIPS are zero-coupon bonds where the principal and interest payments have been stripped from the note or bond and offered as separate securities. STRIPS interest is reported on 1099-OID. From Pub 550:

[QUOTE]
Stripped Bonds and Coupons

If you strip one or more coupons from a bond and sell the bond or the coupons, the bond and coupons are treated as separate debt instruments issued with OID.

The holder of a stripped bond has the right to receive the principal (redemption price) payment. The holder of a stripped coupon has the right to receive interest on the bond.
[/QUOTE]

[QUOTE]
Buyer.

If you buy a stripped bond or stripped coupon, treat it as if it were originally issued on the date you buy it. If you buy a stripped bond, treat as OID any excess of the stated redemption price at maturity over your purchase price. If you buy a stripped coupon, treat as OID any excess of the amount payable on the due date of the coupon over your purchase price.
[/QUOTE]

Kevin

---

*292 posts in this thread*

================================================================================
*Grand total: 1858 posts by Kevin M*
