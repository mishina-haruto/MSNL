let examples = [,
`//データ構造
A:{@AB,@AC,@AD},
B:{@AB},
C:{@AC,@CD},
D:{@AD,@CD}`
,
`//書換え命令
{A,B,C};
{A,B,C} -> {A,B,C,D}`
,
`//変数
{A,B,C};
{@x,@y,@z} -> {@x,@y}`
,
`//文脈
{A,B,C};
{A,$x} -> {A}`
,
`//選択構造
B;
A -> B || B -> C`
,
`//反復構造
{A,B,C};
{@x,$y} -*> {$y},@x`
,
`//ガード
{1,2,3};
{@x,$y} && @x<2|@x>2 -> @x`
,
`//ラッピング
1,2,3;
@x -*> <@x+1>`
,
`//最短経路探索
S:{A:5,B:2},
A:{C:4,D:2},
B:{A:8,D:7},
C:{D:6,G:3},
D:{G:1},
G:{};
@n:@e -*> @n:@e:100:null;
S:@e:100:null -> S:@e:0:null;
<@n1:{@n2:@c,$e1}:@d1:@p1>, @n2:@e2:@d2:@p2 && @d2>@d1+@c -*> @n2:@e2:@d1+@c:@n1;
path:[G];
path:[@n:$p], <@n:@e:@d:@p> && @n!=S -*> path:[@p:@n:$p];`
,
`A:true, B:false;
*(
  @k:false -> <@k:true> ||
  @k:true -> <@k:false>
)`
,
`<a>,b;*(b->)`
]