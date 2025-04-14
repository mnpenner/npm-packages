# Base Converter


## Fun bases

- Base64: Being a power of 2 makes it fast
- Base64url: The same, but doesn't use annoying characters
- Base58: Bitcoin
- Base94: Can be encoded into JSON without escaping
- Base50: All vowels removed makes it hard to product profane strings
- Base16: A classic
- Base83: Blurhash
    - First, 83 seems to be about how many low-ASCII characters you can find that are safe for use in all of JSON, HTML and shells.
    - Secondly, 83 * 83 is very close to, and a little more than, 19 * 19 * 19, making it ideal for encoding three AC components in two characters.
- Base36: Alphanumeric (0-9 + A-Z); compact and case-insensitive; often used for short IDs
- Base62: Alphanumeric (0-9 + A-Z + a-z); more compact than base36, but case-sensitive
- Base32: RFC 4648; safe for DNS and filenames 
- basE91: More compact than base64; designed for efficiency in ASCII encoding
    - Used in APRS (Amateur Packet Reporting System) for compact GPS and telemetry data transmission over radio.
- [base2048](https://github.com/qntm/base2048): optimised for transmitting data through Twitter
- [Base65536](https://github.com/qntm/base65536):  HATETRIS
    - optimised for UTF-32-encoded text,  uses only "safe" Unicode code points
    -  "Tweet length is measured by the number of codepoints in the NFC normalized version of the text.", not by counting the number of bytes in any specific encoding of the text. 


## TODO

Update BufferEncoder to have 2 encode and 3 decode methods.

1. Decode to bigint
2. Encode/decode the mathematical way (using carry) -- bigint seems faster than "streaming"
3. Encode/decode using the closest power of 2 (like base64)

Probably (3) should be a separate class. (1) and (2) are the same algo.

## Optimal Bases

1. Base 2   : 1 bytes <-> 8 chars; MaxVal=256, WastedBits=0
2. Base 4   : 1 bytes <-> 4 chars; MaxVal=256, WastedBits=0
3. Base 8   : 3 bytes <-> 8 chars; MaxVal=16,777,216, WastedBits=0
4. Base 16  : 1 bytes <-> 2 chars; MaxVal=256, WastedBits=0
5. Base 32  : 5 bytes <-> 8 chars; MaxVal=1,099,511,627,776, WastedBits=0
6. Base 64  : 3 bytes <-> 4 chars; MaxVal=16,777,216, WastedBits=0
7. Base 128 : 7 bytes <-> 8 chars; MaxVal=72,057,594,037,927,940, WastedBits=0
8. Base 256 : 1 bytes <-> 1 chars; MaxVal=256, WastedBits=0
9. Base 116 : 6 bytes <-> 7 chars; MaxVal=282,621,973,446,656, WastedBits=0.01
10. Base 102 : 5 bytes <-> 6 chars; MaxVal=1,126,162,419,264, WastedBits=0.03
11. Base 28  : 3 bytes <-> 5 chars; MaxVal=17,210,368, WastedBits=0.04
12. Base 85  : 4 bytes <-> 5 chars; MaxVal=4,437,053,125, WastedBits=0.05
13. Base 75  : 7 bytes <-> 9 chars; MaxVal=75,084,686,279,296,880, WastedBits=0.06
14. Base 41  : 2 bytes <-> 3 chars; MaxVal=68,921, WastedBits=0.07
15. Base 65  : 3 bytes <-> 4 chars; MaxVal=17,850,625, WastedBits=0.09
16. Base 129 : 7 bytes <-> 8 chars; MaxVal=76,686,282,021,340,160, WastedBits=0.09
17. Base 117 : 6 bytes <-> 7 chars; MaxVal=300,124,211,606,973, WastedBits=0.09
18. Base 24  : 4 bytes <-> 7 chars; MaxVal=4,586,471,424, WastedBits=0.09
19. Base 53  : 5 bytes <-> 7 chars; MaxVal=1,174,711,139,837, WastedBits=0.1
20. Base 13  : 6 bytes <-> 13 chars; MaxVal=302,875,106,592,253, WastedBits=0.11
21. Base 103 : 5 bytes <-> 6 chars; MaxVal=1,194,052,296,529, WastedBits=0.12
22. Base 86  : 4 bytes <-> 5 chars; MaxVal=4,704,270,176, WastedBits=0.13
23. Base 22  : 5 bytes <-> 9 chars; MaxVal=1,207,269,217,792, WastedBits=0.13
24. Base 7   : 7 bytes <-> 20 chars; MaxVal=79,792,266,297,612,000, WastedBits=0.15
25. Base 49  : 7 bytes <-> 10 chars; MaxVal=79,792,266,297,612,000, WastedBits=0.15
26. Base 17  : 1 bytes <-> 2 chars; MaxVal=289, WastedBits=0.17
27. Base 42  : 2 bytes <-> 3 chars; MaxVal=74,088, WastedBits=0.18
28. Base 66  : 3 bytes <-> 4 chars; MaxVal=18,974,736, WastedBits=0.18
29. Base 118 : 6 bytes <-> 7 chars; MaxVal=318,547,390,056,832, WastedBits=0.18
30. Base 130 : 7 bytes <-> 8 chars; MaxVal=81,573,072,100,000,000, WastedBits=0.18
31. Base 20  : 7 bytes <-> 13 chars; MaxVal=81,920,000,000,000,000, WastedBits=0.19
32. Base 104 : 5 bytes <-> 6 chars; MaxVal=1,265,319,018,496, WastedBits=0.2
33. Base 87  : 4 bytes <-> 5 chars; MaxVal=4,984,209,207, WastedBits=0.21
34. Base 11  : 3 bytes <-> 7 chars; MaxVal=19,487,171, WastedBits=0.22
35. Base 76  : 7 bytes <-> 9 chars; MaxVal=84,590,643,846,578,180, WastedBits=0.23
36. Base 5   : 2 bytes <-> 7 chars; MaxVal=78,125, WastedBits=0.25
37. Base 119 : 6 bytes <-> 7 chars; MaxVal=337,931,541,778,439, WastedBits=0.26
38. Base 67  : 3 bytes <-> 4 chars; MaxVal=20,151,121, WastedBits=0.26
39. Base 12  : 4 bytes <-> 9 chars; MaxVal=5,159,780,352, WastedBits=0.26
40. Base 131 : 7 bytes <-> 8 chars; MaxVal=86,730,203,469,006,240, WastedBits=0.27
41. Base 43  : 2 bytes <-> 3 chars; MaxVal=79,507, WastedBits=0.28
42. Base 54  : 5 bytes <-> 7 chars; MaxVal=1,338,925,209,984, WastedBits=0.28
43. Base 105 : 5 bytes <-> 6 chars; MaxVal=1,340,095,640,625, WastedBits=0.29
44. Base 29  : 3 bytes <-> 5 chars; MaxVal=20,511,149, WastedBits=0.29
45. Base 88  : 4 bytes <-> 5 chars; MaxVal=5,277,319,168, WastedBits=0.3
46. Base 21  : 6 bytes <-> 11 chars; MaxVal=350,277,500,542,221, WastedBits=0.32
47. Base 18  : 1 bytes <-> 2 chars; MaxVal=324, WastedBits=0.34
48. Base 120 : 6 bytes <-> 7 chars; MaxVal=358,318,080,000,000, WastedBits=0.35
49. Base 68  : 3 bytes <-> 4 chars; MaxVal=21,381,376, WastedBits=0.35
50. Base 33  : 5 bytes <-> 8 chars; MaxVal=1,406,408,618,241, WastedBits=0.36
51. Base 132 : 7 bytes <-> 8 chars; MaxVal=92,170,395,205,042,180, WastedBits=0.36
52. Base 106 : 5 bytes <-> 6 chars; MaxVal=1,418,519,112,256, WastedBits=0.37
53. Base 44  : 2 bytes <-> 3 chars; MaxVal=85,184, WastedBits=0.38
54. Base 89  : 4 bytes <-> 5 chars; MaxVal=5,584,059,449, WastedBits=0.38
55. Base 77  : 7 bytes <-> 9 chars; MaxVal=95,151,694,449,171,440, WastedBits=0.4
56. Base 26  : 7 bytes <-> 12 chars; MaxVal=95,428,956,661,682,180, WastedBits=0.41
57. Base 35  : 7 bytes <-> 11 chars; MaxVal=96,549,157,373,046,880, WastedBits=0.42
58. Base 121 : 6 bytes <-> 7 chars; MaxVal=379,749,833,583,241, WastedBits=0.43
59. Base 69  : 3 bytes <-> 4 chars; MaxVal=22,667,121, WastedBits=0.43
60. Base 50  : 7 bytes <-> 10 chars; MaxVal=97,656,250,000,000,000, WastedBits=0.44
61. Base 133 : 7 bytes <-> 8 chars; MaxVal=97,906,861,202,319,840, WastedBits=0.44
62. Base 107 : 5 bytes <-> 6 chars; MaxVal=1,500,730,351,849, WastedBits=0.45
63. Base 90  : 4 bytes <-> 5 chars; MaxVal=5,904,900,000, WastedBits=0.46
64. Base 55  : 5 bytes <-> 7 chars; MaxVal=1,522,435,234,375, WastedBits=0.47
65. Base 10  : 7 bytes <-> 17 chars; MaxVal=100,000,000,000,000,000, WastedBits=0.47
66. Base 45  : 2 bytes <-> 3 chars; MaxVal=91,125, WastedBits=0.48
67. Base 19  : 1 bytes <-> 2 chars; MaxVal=361, WastedBits=0.5
68. Base 25  : 4 bytes <-> 7 chars; MaxVal=6,103,515,625, WastedBits=0.51
69. Base 122 : 6 bytes <-> 7 chars; MaxVal=402,271,083,010,688, WastedBits=0.52
70. Base 70  : 3 bytes <-> 4 chars; MaxVal=24,010,000, WastedBits=0.52
71. Base 134 : 7 bytes <-> 8 chars; MaxVal=103,953,325,454,500,100, WastedBits=0.53
72. Base 108 : 5 bytes <-> 6 chars; MaxVal=1,586,874,322,944, WastedBits=0.53
73. Base 30  : 3 bytes <-> 5 chars; MaxVal=24,300,000, WastedBits=0.53
74. Base 91  : 4 bytes <-> 5 chars; MaxVal=6,240,321,451, WastedBits=0.54
75. Base 78  : 7 bytes <-> 9 chars; MaxVal=106,868,920,913,284,600, WastedBits=0.57
76. Base 46  : 2 bytes <-> 3 chars; MaxVal=97,336, WastedBits=0.57
77. Base 123 : 6 bytes <-> 7 chars; MaxVal=425,927,596,977,747, WastedBits=0.6
78. Base 71  : 3 bytes <-> 4 chars; MaxVal=25,411,681, WastedBits=0.6
79. Base 109 : 5 bytes <-> 6 chars; MaxVal=1,677,100,110,841, WastedBits=0.61
80. Base 135 : 7 bytes <-> 8 chars; MaxVal=110,324,037,687,890,620, WastedBits=0.61
81. Base 92  : 4 bytes <-> 5 chars; MaxVal=6,590,815,232, WastedBits=0.62
82. Base 56  : 5 bytes <-> 7 chars; MaxVal=1,727,094,849,536, WastedBits=0.65
83. Base 47  : 2 bytes <-> 3 chars; MaxVal=103,823, WastedBits=0.66
84. Base 124 : 6 bytes <-> 7 chars; MaxVal=450,766,669,594,624, WastedBits=0.68
85. Base 72  : 3 bytes <-> 4 chars; MaxVal=26,873,856, WastedBits=0.68
86. Base 110 : 5 bytes <-> 6 chars; MaxVal=1,771,561,000,000, WastedBits=0.69
87. Base 93  : 4 bytes <-> 5 chars; MaxVal=6,956,883,693, WastedBits=0.7
88. Base 34  : 5 bytes <-> 8 chars; MaxVal=1,785,793,904,896, WastedBits=0.7
89. Base 136 : 7 bytes <-> 8 chars; MaxVal=117,033,789,351,264,260, WastedBits=0.7
90. Base 23  : 5 bytes <-> 9 chars; MaxVal=1,801,152,661,463, WastedBits=0.71
91. Base 51  : 7 bytes <-> 10 chars; MaxVal=119,042,423,827,613,010, WastedBits=0.72
92. Base 79  : 7 bytes <-> 9 chars; MaxVal=119,851,595,982,618,320, WastedBits=0.73
93. Base 48  : 2 bytes <-> 3 chars; MaxVal=110,592, WastedBits=0.75
94. Base 73  : 3 bytes <-> 4 chars; MaxVal=28,398,241, WastedBits=0.76
95. Base 125 : 6 bytes <-> 7 chars; MaxVal=476,837,158,203,125, WastedBits=0.76
96. Base 111 : 5 bytes <-> 6 chars; MaxVal=1,870,414,552,161, WastedBits=0.77
97. Base 31  : 3 bytes <-> 5 chars; MaxVal=28,629,151, WastedBits=0.77
98. Base 94  : 4 bytes <-> 5 chars; MaxVal=7,339,040,224, WastedBits=0.77
99. Base 137 : 7 bytes <-> 8 chars; MaxVal=124,097,929,967,680,320, WastedBits=0.78
100. Base 57  : 5 bytes <-> 7 chars; MaxVal=1,954,897,493,193, WastedBits=0.83
101. Base 74  : 3 bytes <-> 4 chars; MaxVal=29,986,576, WastedBits=0.84
102. Base 126 : 6 bytes <-> 7 chars; MaxVal=504,189,521,813,376, WastedBits=0.84
103. Base 112 : 5 bytes <-> 6 chars; MaxVal=1,973,822,685,184, WastedBits=0.84
104. Base 95  : 4 bytes <-> 5 chars; MaxVal=7,737,809,375, WastedBits=0.85
105. Base 138 : 7 bytes <-> 8 chars; MaxVal=131,532,383,853,732,100, WastedBits=0.87
106. Base 6   : 7 bytes <-> 22 chars; MaxVal=131,621,703,842,267,140, WastedBits=0.87
107. Base 36  : 7 bytes <-> 11 chars; MaxVal=131,621,703,842,267,140, WastedBits=0.87
108. Base 80  : 7 bytes <-> 9 chars; MaxVal=134,217,728,000,000,000, WastedBits=0.9
109. Base 127 : 6 bytes <-> 7 chars; MaxVal=532,875,860,165,503, WastedBits=0.92
110. Base 113 : 5 bytes <-> 6 chars; MaxVal=2,081,951,752,609, WastedBits=0.92
111. Base 96  : 4 bytes <-> 5 chars; MaxVal=8,153,726,976, WastedBits=0.92
112. Base 139 : 7 bytes <-> 8 chars; MaxVal=139,353,667,211,683,680, WastedBits=0.95
113. Base 114 : 5 bytes <-> 6 chars; MaxVal=2,194,972,623,936, WastedBits=1
114. Base 97  : 4 bytes <-> 5 chars; MaxVal=8,587,340,257, WastedBits=1
115. Base 52  : 7 bytes <-> 10 chars; MaxVal=144,555,105,949,057,020, WastedBits=1
116. Base 58  : 5 bytes <-> 7 chars; MaxVal=2,207,984,167,552, WastedBits=1.01
117. Base 140 : 7 bytes <-> 8 chars; MaxVal=147,578,905,600,000,000, WastedBits=1.03
118. Base 9   : 7 bytes <-> 18 chars; MaxVal=150,094,635,296,999,140, WastedBits=1.06
119. Base 27  : 7 bytes <-> 12 chars; MaxVal=150,094,635,296,999,140, WastedBits=1.06
120. Base 81  : 7 bytes <-> 9 chars; MaxVal=150,094,635,296,999,140, WastedBits=1.06
121. Base 115 : 5 bytes <-> 6 chars; MaxVal=2,313,060,765,625, WastedBits=1.07
122. Base 98  : 4 bytes <-> 5 chars; MaxVal=9,039,207,968, WastedBits=1.07
123. Base 14  : 7 bytes <-> 15 chars; MaxVal=155,568,095,557,812,220, WastedBits=1.11
124. Base 141 : 7 bytes <-> 8 chars; MaxVal=156,225,851,787,813,920, WastedBits=1.12
125. Base 3   : 6 bytes <-> 31 chars; MaxVal=617,673,396,283,947, WastedBits=1.13
126. Base 99  : 4 bytes <-> 5 chars; MaxVal=9,509,900,499, WastedBits=1.15
127. Base 59  : 5 bytes <-> 7 chars; MaxVal=2,488,651,484,819, WastedBits=1.18
128. Base 142 : 7 bytes <-> 8 chars; MaxVal=165,312,903,998,914,800, WastedBits=1.2
129. Base 82  : 7 bytes <-> 9 chars; MaxVal=167,619,550,409,708,030, WastedBits=1.22
130. Base 100 : 4 bytes <-> 5 chars; MaxVal=10,000,000,000, WastedBits=1.22
131. Base 143 : 7 bytes <-> 8 chars; MaxVal=174,859,124,550,883,200, WastedBits=1.28
132. Base 101 : 4 bytes <-> 5 chars; MaxVal=10,510,100,501, WastedBits=1.29
133. Base 37  : 7 bytes <-> 11 chars; MaxVal=177,917,621,779,460,400, WastedBits=1.3
134. Base 60  : 5 bytes <-> 7 chars; MaxVal=2,799,360,000,000, WastedBits=1.35
135. Base 144 : 7 bytes <-> 8 chars; MaxVal=184,884,258,895,036,400, WastedBits=1.36
136. Base 83  : 7 bytes <-> 9 chars; MaxVal=186,940,255,267,540,400, WastedBits=1.38
137. Base 145 : 7 bytes <-> 8 chars; MaxVal=195,408,755,062,890,620, WastedBits=1.44
138. Base 61  : 5 bytes <-> 7 chars; MaxVal=3,142,742,836,021, WastedBits=1.52
139. Base 146 : 7 bytes <-> 8 chars; MaxVal=206,453,783,524,884,740, WastedBits=1.52
140. Base 84  : 7 bytes <-> 9 chars; MaxVal=208,215,748,530,929,660, WastedBits=1.53
141. Base 147 : 7 bytes <-> 8 chars; MaxVal=218,041,257,467,152,160, WastedBits=1.6
142. Base 148 : 7 bytes <-> 8 chars; MaxVal=230,193,853,492,166,660, WastedBits=1.68
143. Base 62  : 5 bytes <-> 7 chars; MaxVal=3,521,614,606,208, WastedBits=1.68
144. Base 38  : 7 bytes <-> 11 chars; MaxVal=238,572,050,223,552,500, WastedBits=1.73
145. Base 149 : 7 bytes <-> 8 chars; MaxVal=242,935,032,749,128,800, WastedBits=1.75
146. Base 150 : 7 bytes <-> 8 chars; MaxVal=256,289,062,500,000,000, WastedBits=1.83
147. Base 63  : 5 bytes <-> 7 chars; MaxVal=3,938,980,639,167, WastedBits=1.84
148. Base 151 : 7 bytes <-> 8 chars; MaxVal=270,281,038,127,131,200, WastedBits=1.91
149. Base 152 : 7 bytes <-> 8 chars; MaxVal=284,936,905,588,473,860, WastedBits=1.98
150. Base 153 : 7 bytes <-> 8 chars; MaxVal=300,283,484,326,400,960, WastedBits=2.06
151. Base 154 : 7 bytes <-> 8 chars; MaxVal=316,348,490,636,206,340, WastedBits=2.13
152. Base 39  : 7 bytes <-> 11 chars; MaxVal=317,475,837,322,472,450, WastedBits=2.14
153. Base 155 : 7 bytes <-> 8 chars; MaxVal=333,160,561,500,390,660, WastedBits=2.21
154. Base 156 : 7 bytes <-> 8 chars; MaxVal=350,749,278,894,882,800, WastedBits=2.28
155. Base 157 : 7 bytes <-> 8 chars; MaxVal=369,145,194,573,386,430, WastedBits=2.36
156. Base 158 : 7 bytes <-> 8 chars; MaxVal=388,379,855,336,079,600, WastedBits=2.43
157. Base 159 : 7 bytes <-> 8 chars; MaxVal=408,485,828,788,939,500, WastedBits=2.5
158. Base 40  : 7 bytes <-> 11 chars; MaxVal=419,430,400,000,000,000, WastedBits=2.54
159. Base 160 : 7 bytes <-> 8 chars; MaxVal=429,496,729,600,000,000, WastedBits=2.58
160. Base 15  : 7 bytes <-> 15 chars; MaxVal=437,893,890,380,859,400, WastedBits=2.6
161. Base 161 : 7 bytes <-> 8 chars; MaxVal=451,447,246,258,894,100, WastedBits=2.65
162. Base 162 : 7 bytes <-> 8 chars; MaxVal=474,373,168,346,071,300, WastedBits=2.72
163. Base 163 : 7 bytes <-> 8 chars; MaxVal=498,311,414,318,121,150, WastedBits=2.79
164. Base 164 : 7 bytes <-> 8 chars; MaxVal=523,300,059,815,673,860, WastedBits=2.86
165. Base 165 : 7 bytes <-> 8 chars; MaxVal=549,378,366,500,390,660, WastedBits=2.93
166. Base 166 : 7 bytes <-> 8 chars; MaxVal=576,586,811,427,594,500, WastedBits=3
167. Base 167 : 7 bytes <-> 8 chars; MaxVal=604,967,116,961,135,100, WastedBits=3.07
168. Base 168 : 7 bytes <-> 8 chars; MaxVal=634,562,281,237,119,000, WastedBits=3.14
169. Base 169 : 7 bytes <-> 8 chars; MaxVal=665,416,609,183,179,900, WastedBits=3.21
170. Base 170 : 7 bytes <-> 8 chars; MaxVal=697,575,744,100,000,000, WastedBits=3.28
171. Base 171 : 7 bytes <-> 8 chars; MaxVal=731,086,699,811,838,600, WastedBits=3.34
172. Base 172 : 7 bytes <-> 8 chars; MaxVal=765,997,893,392,859,100, WastedBits=3.41
173. Base 173 : 7 bytes <-> 8 chars; MaxVal=802,359,178,476,091,600, WastedBits=3.48
174. Base 174 : 7 bytes <-> 8 chars; MaxVal=840,221,879,151,903,000, WastedBits=3.54
175. Base 175 : 7 bytes <-> 8 chars; MaxVal=879,638,824,462,890,600, WastedBits=3.61
176. Base 176 : 7 bytes <-> 8 chars; MaxVal=920,664,383,502,155,800, WastedBits=3.68
177. Base 177 : 7 bytes <-> 8 chars; MaxVal=963,354,501,121,950,100, WastedBits=3.74
178. Base 178 : 7 bytes <-> 8 chars; MaxVal=1,007,766,734,259,732,700, WastedBits=3.81
179. Base 179 : 7 bytes <-> 8 chars; MaxVal=1,053,960,288,888,713,700, WastedBits=3.87
180. Base 180 : 7 bytes <-> 8 chars; MaxVal=1,101,996,057,600,000,000, WastedBits=3.93
181. Base 181 : 7 bytes <-> 8 chars; MaxVal=1,151,936,657,823,500,700, WastedBits=4
182. Base 182 : 7 bytes <-> 8 chars; MaxVal=1,203,846,470,694,789,400, WastedBits=4.06
183. Base 183 : 7 bytes <-> 8 chars; MaxVal=1,257,791,680,575,160,600, WastedBits=4.13
184. Base 184 : 7 bytes <-> 8 chars; MaxVal=1,313,840,315,232,157,700, WastedBits=4.19
185. Base 185 : 7 bytes <-> 8 chars; MaxVal=1,372,062,286,687,890,700, WastedBits=4.25
186. Base 186 : 7 bytes <-> 8 chars; MaxVal=1,432,529,432,742,502,700, WastedBits=4.31
187. Base 187 : 7 bytes <-> 8 chars; MaxVal=1,495,315,559,180,183,600, WastedBits=4.38
188. Base 188 : 7 bytes <-> 8 chars; MaxVal=1,560,496,482,665,169,000, WastedBits=4.44
189. Base 189 : 7 bytes <-> 8 chars; MaxVal=1,628,150,074,335,205,400, WastedBits=4.5
190. Base 190 : 7 bytes <-> 8 chars; MaxVal=1,698,356,304,100,000,000, WastedBits=4.56
191. Base 191 : 7 bytes <-> 8 chars; MaxVal=1,771,197,285,652,216,300, WastedBits=4.62
192. Base 192 : 7 bytes <-> 8 chars; MaxVal=1,846,757,322,198,614,000, WastedBits=4.68
193. Base 193 : 7 bytes <-> 8 chars; MaxVal=1,925,122,952,918,976,000, WastedBits=4.74
194. Base 194 : 7 bytes <-> 8 chars; MaxVal=2,006,383,000,160,502,000, WastedBits=4.8
195. Base 195 : 7 bytes <-> 8 chars; MaxVal=2,090,628,617,375,390,700, WastedBits=4.86
196. Base 196 : 7 bytes <-> 8 chars; MaxVal=2,177,953,337,809,371,100, WastedBits=4.92
197. Base 197 : 7 bytes <-> 8 chars; MaxVal=2,268,453,123,948,987,400, WastedBits=4.98
198. Base 198 : 7 bytes <-> 8 chars; MaxVal=2,362,226,417,735,475,000, WastedBits=5.03
199. Base 199 : 7 bytes <-> 8 chars; MaxVal=2,459,374,191,553,118,000, WastedBits=5.09
200. Base 200 : 7 bytes <-> 8 chars; MaxVal=2,560,000,000,000,000,000, WastedBits=5.15
201. Base 201 : 7 bytes <-> 8 chars; MaxVal=2,664,210,032,449,122,000, WastedBits=5.21
202. Base 202 : 7 bytes <-> 8 chars; MaxVal=2,772,113,166,407,885,000, WastedBits=5.27
203. Base 203 : 7 bytes <-> 8 chars; MaxVal=2,883,821,021,683,986,000, WastedBits=5.32
204. Base 204 : 7 bytes <-> 8 chars; MaxVal=2,999,448,015,365,800,000, WastedBits=5.38
205. Base 205 : 7 bytes <-> 8 chars; MaxVal=3,119,111,417,625,390,600, WastedBits=5.44
206. Base 206 : 7 bytes <-> 8 chars; MaxVal=3,242,931,408,352,297,000, WastedBits=5.49
207. Base 207 : 7 bytes <-> 8 chars; MaxVal=3,371,031,134,626,313,700, WastedBits=5.55
208. Base 208 : 7 bytes <-> 8 chars; MaxVal=3,503,536,769,037,500,400, WastedBits=5.6
209. Base 209 : 7 bytes <-> 8 chars; MaxVal=3,640,577,568,861,717,000, WastedBits=5.66
210. Base 210 : 7 bytes <-> 8 chars; MaxVal=3,782,285,936,100,000,000, WastedBits=5.71
211. Base 211 : 7 bytes <-> 8 chars; MaxVal=3,928,797,478,390,152,700, WastedBits=5.77
212. Base 212 : 7 bytes <-> 8 chars; MaxVal=4,080,251,070,798,954,500, WastedBits=5.82
213. Base 213 : 7 bytes <-> 8 chars; MaxVal=4,236,788,918,503,438,000, WastedBits=5.88
214. Base 214 : 7 bytes <-> 8 chars; MaxVal=4,398,556,620,369,715,000, WastedBits=5.93
215. Base 215 : 7 bytes <-> 8 chars; MaxVal=4,565,703,233,437,890,600, WastedBits=5.99
216. Base 216 : 7 bytes <-> 8 chars; MaxVal=4,738,381,338,321,617,000, WastedBits=6.04
217. Base 217 : 7 bytes <-> 8 chars; MaxVal=4,916,747,105,530,914,000, WastedBits=6.09
218. Base 218 : 7 bytes <-> 8 chars; MaxVal=5,100,960,362,726,892,000, WastedBits=6.15
219. Base 219 : 7 bytes <-> 8 chars; MaxVal=5,291,184,662,917,066,000, WastedBits=6.2
220. Base 220 : 7 bytes <-> 8 chars; MaxVal=5,487,587,353,600,000,000, WastedBits=6.25
221. Base 221 : 7 bytes <-> 8 chars; MaxVal=5,690,339,646,868,045,000, WastedBits=6.3
222. Base 222 : 7 bytes <-> 8 chars; MaxVal=5,899,616,690,476,974,000, WastedBits=6.36
223. Base 223 : 7 bytes <-> 8 chars; MaxVal=6,115,597,639,891,380,000, WastedBits=6.41
224. Base 224 : 7 bytes <-> 8 chars; MaxVal=6,338,465,731,314,713,000, WastedBits=6.46
225. Base 225 : 7 bytes <-> 8 chars; MaxVal=6,568,408,355,712,891,000, WastedBits=6.51
226. Base 226 : 7 bytes <-> 8 chars; MaxVal=6,805,617,133,840,466,000, WastedBits=6.56
227. Base 227 : 7 bytes <-> 8 chars; MaxVal=7,050,287,992,278,342,000, WastedBits=6.61
228. Base 228 : 7 bytes <-> 8 chars; MaxVal=7,302,621,240,492,098,000, WastedBits=6.66
229. Base 229 : 7 bytes <-> 8 chars; MaxVal=7,562,821,648,920,027,000, WastedBits=6.71
230. Base 230 : 7 bytes <-> 8 chars; MaxVal=7,831,098,528,100,000,000, WastedBits=6.76
231. Base 231 : 7 bytes <-> 8 chars; MaxVal=8,107,665,808,844,335,000, WastedBits=6.81
232. Base 232 : 7 bytes <-> 8 chars; MaxVal=8,392,742,123,471,897,000, WastedBits=6.86
233. Base 233 : 7 bytes <-> 8 chars; MaxVal=8,686,550,888,106,662,000, WastedBits=6.91
234. Base 234 : 7 bytes <-> 8 chars; MaxVal=8,989,320,386,052,055,000, WastedBits=6.96
235. Base 235 : 7 bytes <-> 8 chars; MaxVal=9,301,283,852,250,390,000, WastedBits=7.01
236. Base 236 : 7 bytes <-> 8 chars; MaxVal=9,622,679,558,836,781,000, WastedBits=7.06
237. Base 237 : 7 bytes <-> 8 chars; MaxVal=9,953,750,901,796,946,000, WastedBits=7.11
238. Base 238 : 7 bytes <-> 8 chars; MaxVal=10,294,746,488,738,365,000, WastedBits=7.16
239. Base 239 : 7 bytes <-> 8 chars; MaxVal=10,645,920,227,784,268,000, WastedBits=7.21
240. Base 240 : 7 bytes <-> 8 chars; MaxVal=11,007,531,417,600,000,000, WastedBits=7.26
241. Base 241 : 7 bytes <-> 8 chars; MaxVal=11,379,844,838,561,358,000, WastedBits=7.3
242. Base 242 : 7 bytes <-> 8 chars; MaxVal=11,763,130,845,074,473,000, WastedBits=7.35
243. Base 243 : 7 bytes <-> 8 chars; MaxVal=12,157,665,459,056,929,000, WastedBits=7.4
244. Base 244 : 7 bytes <-> 8 chars; MaxVal=12,563,730,464,589,808,000, WastedBits=7.45
245. Base 245 : 7 bytes <-> 8 chars; MaxVal=12,981,613,503,750,390,000, WastedBits=7.49
246. Base 246 : 7 bytes <-> 8 chars; MaxVal=13,411,608,173,635,297,000, WastedBits=7.54
247. Base 247 : 7 bytes <-> 8 chars; MaxVal=13,854,014,124,583,883,000, WastedBits=7.59
248. Base 248 : 7 bytes <-> 8 chars; MaxVal=14,309,137,159,611,744,000, WastedBits=7.63
249. Base 249 : 7 bytes <-> 8 chars; MaxVal=14,777,289,335,064,248,000, WastedBits=7.68
250. Base 250 : 7 bytes <-> 8 chars; MaxVal=15,258,789,062,500,000,000, WastedBits=7.73
251. Base 251 : 7 bytes <-> 8 chars; MaxVal=15,753,961,211,814,253,000, WastedBits=7.77
252. Base 252 : 7 bytes <-> 8 chars; MaxVal=16,263,137,215,612,256,000, WastedBits=7.82
253. Base 253 : 7 bytes <-> 8 chars; MaxVal=16,786,655,174,842,630,000, WastedBits=7.86
254. Base 254 : 7 bytes <-> 8 chars; MaxVal=17,324,859,965,700,833,000, WastedBits=7.91
255. Base 255 : 7 bytes <-> 8 chars; MaxVal=17,878,103,347,812,890,000, WastedBits=7.95
