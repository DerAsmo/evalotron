(function($) {
	/* ************** *
	 * Variables      *
	 * ************** */

	var accounts = [];

	/* ************** *
	 * Functions      *
	 * ************** */
	function formatContent(content) {
		function nl2br (str, is_xhtml) {   
			var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
		}

		var output = nl2br(content);
		return output;
	}

	function evaluationToHTML(key, users) {
		var output = '';

		var keywordstring = '';
		if(key != '') {
			keywordstring = ' mentioning "' + key + '"';
		}

		output += '<div class="evaluation">';
			output += '<span>Following users responded to your post' + keywordstring + ': ' + users.join(', ');
		output += '</div>';

		return output;
	}

	function commentToHTML(comment) {
		var output = '';

		output += '<div class="comment-container">';
			output += '<div class="comment-info">';
				output += '<div class="user">';
					output += '<div class="user-pic"></div>';
					output += '<div class="user-name">' + comment['author'] + '</div>';
				output += '</div>';
			output += '</div>';
			output += '<div class="comment-body">';
			output += formatContent(comment['body']);
			output += '</div>';
		output += '</div>';

		return output;
	}

	function addAccounts(addAccounts) {
		$(addAccounts)
			.each(function() {
				var accountName = this['name'];
				accounts[accountName] = this;
			});
	}

	function getAccounts(accountNames) {

		if(accountNames.constructor === Array) {

			var unknown = [];
			$(accountNames)
				.each(function() {
					if(accounts[this] === undefined) {
						unknown.push(this);
					}
				});

			if(unknown.length > 0) {
				steem.api.getAccounts(unknown, function(err, result) {
					addAccounts(result);
				});
			}
		}

		return accounts;
	}
	/* ************** *
	 * Document Ready *
	 * ************** */
	$(document)
		.ready(function(){

			// search the comments of a post by search key on button click
			$('.button-search')
				.click(function(){
					var author = $('#search_author').val();
					var permlink = $('#search_permlink').val();
					var key = $('#search_key').val();

					// get all comments on a post from the api
					steem.api.getContentReplies(author, permlink, function(err, results) {

						var showResults = results;
						// if search key is set, filter resultss
						if(key) {
							showResults = [];

							$(results)
								.each(function() {
									var comment = this;
									var comment_body = comment['body'];

									if (comment_body.toLowerCase().indexOf( key.toLowerCase() ) >= 0) {
										showResults.push(comment);
									}
								});
						}


						var users = [];
						var commentListHTML = '';
						// iterate through comments to be displayed
						// collect data, prepare html
						$(showResults)
							.each(function(){
								// add user to the list
								var user = this['author'];
								if(!(user in users)) {
									users.push(user);
								}

								// process comment data to html
								commentListHTML += commentToHTML(this);
							});

						// evaluation of processed data
						var evaluationHTML = evaluationToHTML(key, users);

						var content = evaluationHTML + commentListHTML;
						$('#content').html(content);
					});
				})
				.click();
		}); // end - $(document).ready();
})(jQuery);