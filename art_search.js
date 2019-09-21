$('h2').html('気になるボタンを選んでみよう!');
$('#thumbnail_list').hide();
$('#details').hide();
$('.readMoreBtn').hide();
let maxThumCnt = 0;     // 最大表示件数
let currentThumCnt = 0; // 現在の表示件数
const defaultThumCnt = 10; // 初期表示件数
const addThumCnt = 10;     // 追加表示件数
let thumbnailNum = $('#thumbnail_list').children('li');

//プラウザ戻る、進むイベント(popstate)
window.addEventListener("popstate", function(e){
	//stateで判断
	if(e.state == null){
		$('#details').hide();
		$('#contents').hide();
		$('#tagButtonList').fadeIn();
	}else if(e.state == '#thumbnail'){
		$('#tagButtonList').hide();
		$('#contents').fadeIn();
		$('#contents ul').fadeIn();
		$('#details').hide();
	}else if(e.state == '#details'){
		$('#contents').hide();
	$('#details').fadeIn();
	}
});

//作品詳細から一気にTOP戻る
$(document).on('click','#top_back_button', function () {
	location.href = '/art-seach/';
});

//ひとつ前に戻るボタンが押されたとき
$(document).on('click','#back_button', function () {
	if(history.state == '#thumbnail'){
		history.pushState(null,null,"");
		$('#details').hide();
		$('#contents').hide();
		$('#tagButtonList').fadeIn();
	}else if(history.state == '#details'){
		history.pushState('#thumbnail',null,"");
		$('#tagButtonList').hide();
		$('#contents').fadeIn();
		$('#contents ul').fadeIn();
		$('#details').hide();
	}
});
	//タグボタンクリックイベント
$(document).on('click','#tag_button', function () {

	let tagVal = $(this).val();
	$(this).prop('disabled',true);
	//サムネイル一覧画面の履歴保存
	history.pushState('#thumbnail',null,"");

	ObjIdAjax(tagVal).then(function(data) {		//IDsを取得
		$('#contents ul').empty();
		$('#tagButtonList').fadeOut();
		$('#contents').fadeIn();
		$('#contents ul').fadeIn();

		//初期サムネイル表示
		thumDisplay(data['objectIDs']);
		$('#navBer button').prop('disabled', false);

		//もっと見るクリックイベント
		$('.readMoreBtn').click(function () {
			currentThumCnt += addThumCnt;//10づつ増えていく
			thumDisplay(data['objectIDs']);
		});
	});
});

//作品のIDを取得して詳細を表示
$(document).on("click", "#thumbnailArt", function () {

	//レスポンシブル用のHTML生成
	let windowWid = $(window).width();
	  if(windowWid<=479){
		 $('.artist-detail li,.artWork-detail li').unwrap();
		 $('.details-document li').wrapAll('<ul class="responsive-details">');
	 }

	//作品詳細画面の履歴保存
	history.pushState('#details',null,"");

	//一回imageを空にして再描写
	$('#details #primaryImage img').attr('src','');
	$('#contents').hide();
	$('#details').show();

	let artIdVal = $(this).val();
	objDetailAjax(artIdVal).then(function(data){//詳細リクエストajax
		let transTags;
		let transTitle;
		let transArtistNationality;
		let transMedium;
		let transArtistDisplayName;
		let transArtistDisplayBio;
		//タグの配列を文字列にする。
		let tags = data['tags'].join(',');
		//$('#text').text(tags);
		let artistDisplayBio = JSON.stringify(data.artistDisplayBio);

		//処理をするajaxを配列にして並列処理で詳細データを翻訳
		var transAjaxArray = [googleApiAjax(data.artistDisplayName),googleApiAjax(data.artistNationality)
			,googleApiAjax(data.title),googleApiAjax(data.medium),googleApiAjax(tags),googleApiAjax(artistDisplayBio)];

		$.when.apply($, transAjaxArray).then(function() {
			transArtistDisplayName = arguments[0][0]['data']['translations'][0]['translatedText'];
			transArtistNationality = arguments[1][0]['data']['translations'][0]['translatedText'];
			transTitle  = arguments[2][0]['data']['translations'][0]['translatedText'];
			transMedium  = arguments[3][0]['data']['translations'][0]['translatedText'];
			transTags  = arguments[4][0]['data']['translations'][0]['translatedText'];
			transArtistDisplayBio = arguments[5][0]['data']['translations'][0]['translatedText'];
		}
		 ,function() {
			transArtistDisplayName = data.artistDisplayName;
			transArtistNationality =data.artistNationality;
			transTitle  = data.title;
			transMedium  = data.Medium;
			transTags  = tags;
			transArtistDisplayBio = data.artistDisplayBio;
		 })
		.always(function() {
			$('#details #primaryImage img').attr('src',data['primaryImage']);
			//作者詳細データ
			$('#details .artistDisplayName').html('作者：'+ transArtistDisplayName );
			$('#details .artistCountry').html('国籍：'+ transArtistNationality);
			$('#details .artistDisplayBio').html('生まれ、生誕～死去、死没地：'+ transArtistDisplayBio);
			//作品詳細データ
			$('#details .title').html('タイトル：' + '「'+transTitle+'」');
			$('#details .objectDate').html('作成日：' + data.objectDate);
			$('#details .medium').html('素材：' +transMedium);
			$('#details .dimensions').html('大きさ：' + data.dimensions);
			$('#details .tags').html('タグ：' + transTags);
		});
	});
});

//サムネイル表示関数
function  thumDisplay(objectDataIDs){
	let thumbnailList = objectDataIDs;
	let transTitleThum;

	//(今表示されている画像の次<10件）の範囲のサムネイル配列をretrunしている
	let filteredObjIDs = thumbnailList.filter(function(element, index, array) {
		let newCount =currentThumCnt + addThumCnt; // 新しくサムネイルを表示する件数
		if(currentThumCnt == 0){
			return (index <  defaultThumCnt);
		}
			return (currentThumCnt <= index  && index < newCount);
	});

	$(filteredObjIDs).each(function (j, objIdData) {
		ThumListAjax(objIdData).done(function(objDataJson){
			googleApiAjax(objDataJson.title).then(function(transTitle){
				transTitleThum = transTitle['data']['translations'][0]['translatedText'];
			},function(){
				transTitleThum = objDataJson['title'];
			}).always(function(){
				$('#thumbnail_list').append('<li id="thumbnailArt" class="thumbnail-art" value="' + objDataJson['objectID']
				+ '"data-count="'+j+'"><img src="'+ objDataJson['primaryImageSmall'] + '"id="thumbnail_images" class="thumbnail-images" alt="画像"><p>'
				+'「'+transTitleThum +'」'+'</p></li>');
			});
			maxThumCnt++;

			//もっと見るボタン表示
			if(objectDataIDs.length != maxThumCnt){
				$('.readMoreBtn').show();
			}else{
				$('.readMoreBtn').hide();
			}
		});
	});
}

//①ID取得ajax
function ObjIdAjax(tagVal){
	return $.ajax({
	    url: 'https://collectionapi.metmuseum.org/public/collection/v1/search',
	    type:'GET',
	    dataType: 'json',
	    timeout:20000,
	    data:{
	    	'isOnView':true,
	    	'hasImages':true,
	    	'q': tagVal
	    }
	})
};
//②サムネイルを取得ajax
function ThumListAjax(objectIDs){
	return $.ajax({
	  url: 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'+ objectIDs,
	  type:'GET',
	  dataType: 'json',
	  timeout:20000
	})
};
//③ 詳細情報取得ajax
function objDetailAjax (artIdVal){
	return $.ajax({
	    url: 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'+ artIdVal,
	    type:'GET',
	    dataType: 'json',
	    timeout:10000
	});
};
//④googoleAPIを呼び出すajax
function googleApiAjax(translationData) {
	return $.ajax({
		url: 'https://translation.googleapis.com/language/translate/v2/',
		type:'POST',
		dataType: 'json',
		data:{
			'q':translationData,
			'target': 'ja',
			"format": "text",
			'key': 'AIzaSyBAWzaDZcce7O8UURlYjmNIy4mGt6KtPWc'
		}
	});
};

