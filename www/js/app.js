// (1) 起動時の処理
var table;
ons.ready(function() {
	// Azureの接続準備
	var azure = new WindowsAzure.MobileServiceClient("App ServiceのURL");
	table = azure.getTable("userComments");
	showComments();
});

// (2) コメント取得処理
function showComments() {
	document.getElementById("modal").show();
	// リストを初期化
    var list = document.getElementById("timeline");
    var htmlStr = '';
    
    // 直近のコメントから、100件分取得する
    table
    .orderByDescending("createdAt")     // 作成日が新しい順に並び替え
    .take(100)                          // 最大100件
    .read()
    .done(function (items) {
        // 1件ずつリストに追加する
        items.forEach(function (item) {
            htmlStr += createListItem(item);
		});
		list.innerHTML = htmlStr;
		document.getElementById("modal").hide();
    }, function (err) {
        alert(err.message);
        document.getElementById("modal").hide();
    });
}

// １件分のメモを表すHTML要素を作成
function createListItem(data) {
	var style = "";
	var clickEvent = "";
	
	// 自分の書き込みだった場合
    if(data.uuid == device.uuid) {
    	style = "color:blue";
    	clickEvent = "onclick='showEditPage(" + JSON.stringify(data) + ")'";
    }	
    
    var item = "<ons-list-item modifier='longdivider' class='item' " + clickEvent + ">"
            + "<p class='comment' style='" + style + "'>" + data.comment + "</p>"
        	+ "</ons-list-item>";
    return item;
}

// 追加ボタンを押したときの処理
function showNewPage() {
	document.getElementById("navi").pushPage("new.html");
}

// (3) コメント追加処理
function addComment() {
	// 入力されたコメントとUUIDを取得
    var item = {
        comment: document.getElementById("add-comment").value,
        uuid: device.uuid
    };
    // Azureにデータ登録
    table.insert(item)
    .done(function () {
        showComments();
        document.getElementById("navi").popPage();
    }, function (err) {
        alert(err.message);
    });
}

// 編集ボタンを押したときの処理
function showEditPage(data) {
	document.getElementById("navi").pushPage("edit.html")
	.then(function() {
		document.getElementById("edit-comment").value = data.comment;
		
	    // 保存ボタンを押した時の処理
	    document.getElementById("edit-save-btn").onclick = function() {
	    	editComment(data.id);
	    };
	
	    // 削除アイコンを押した時の処理
	    document.getElementById("del-btn").onclick = function() {
	     	delComment(data.id);
	    };
	});
}

// (4) コメント編集処理
function editComment(id) {
    var item = {
        id: id,
        comment: document.getElementById("edit-comment").value
    };
    // Azureのデータ更新
    table.update(item)
    .done(function () {
        showComments();
        // 一覧ページに戻る
        document.getElementById("navi").popPage();
    }, function (err) {
        alert(err.message);
    });
}

// (5) コメント削除処理
function delComment(id) {
    ons.notification.confirm({
        title: "確認",
        message: "このコメントを削除してよろしいですか？",
        callback: function (index) {
            // キャンセルを押されたら終了
            if (!index) return;

            var item = { id: id };
            // Azureのデータ削除
            table.del(item)
            .done(function () {
                showComments();
                // 一覧ページに戻る
                document.getElementById("navi").popPage();
            }, function (err) {
                alert(err.message);
            });
        }
    });
}