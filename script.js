(function($) {
	/* ************** *
	 * Variables      *
	 * ************** */

	var post;
	var accounts = [];
	var comments = [];
	var votes = [];
	var followers = [];

	/* ************** *
	 * Functions      *
	 * ************** */

	/**
	 * Returns an array with all users from a list of comments.
	 *
	 * @param Array comments
	 * @returns Object
	 */
	function getUsers(comments, processed = true) {
		var users = [];

		$(comments)
			.each(function() {
				if(processed) {
					users.push(this.comment.author);
				} else {
					users.push(this.author);
				}
			});

		return users;
	};

	/**
	 * Returns an array with all users from a list of comments.
	 *
	 * @param Array comments
	 * @returns Object
	 */
	function getVoter() {
		var voter = [];

		$(votes)
			.each(function() {
				voter.push(this.voter);
			});

		return voter;
	};

	/**
	 * Returns an array containing all options with associated keywords.
	 *
	 * @param JQuery inputOptions
	 * @returns Array
	 */
	function buildOptionsArray(inputOptions) {

		var options = [];
		inputOptions
			.each(function(optionIndex) {
				var keystring = $(this).val();

				if( keystring.length > 0) {
					options[optionIndex] = keystring.split(';').map(function(item) { return item.trim(); });
				}
			});

		return options;
	}

	/**
	 * Returns true if any of the given keywords are found in content.
	 *
	 * @param String content
	 * @param Array keys
	 * @returns Array
	 */
	function searchKeys(content, keys) {

		var contained = false;
		$(keys)
			.each(function() {

				// check content for search key
				if (content.toLowerCase().indexOf( this.toLowerCase() ) >= 0) {
					contained = true;
					return false;
				}
			});

		return contained;
	}

	/**
	 * Returns an array containing all indices of options found in content string.
	 *
	 * @param String content 
	 * @param Array options 
	 * @returns Array
	 */
	function searchOptions(content, options) {

		var optionsFound = [];
		$(options)
			.each(function(optionIndex) {
				var contained = searchKeys(content, this);
				if(contained !== false) {
					optionsFound.push(optionIndex);
				}
			});

		return optionsFound;
	}

	/**
	 * Returns an object with comments sorted by option.
	 *
	 * @param Array comments
	 * @returns Object
	 */
	function sortCommentsByOption(comments, voter, filter) {
		var commentsByOption = [];
		var unresolved = [];
		var unlocated = [];

		// !filter.upvotedOnly || (voter.indexOf(cComment.author) > -1)
		$(comments)
			.each(function() {
				var cOptions = this['options'];
				var validByUpvote = !filter.upvotedOnly || (voter.indexOf(this.comment.author) > -1);
				var validByFollow = !filter.followingOnly || (followers.indexOf(this.comment.author) > -1);
				var valid = validByUpvote && validByFollow;

				if(cOptions.length == 0 || !valid) {
					unlocated.push(this);
				} else if (cOptions.length == 1) {
					var key = cOptions[0];
					if(!(key in commentsByOption)) {
						commentsByOption[key] = [];
					}
					commentsByOption[key].push(this);
				} else {
					unresolved.push(this);
				}
			});

		var output = new Object();
		output.byOption = commentsByOption;
		output.unresolved = unresolved;
		output.unlocated = unlocated;

		return output;
	};

	/* ************** *
	 * Functions Tabs *
	 * ************** */

	function applyTabSwitch() {
		if( $('.nav-tabs > li > a').length > 0 ) {
			$('.nav-tabs > li > a')
				.click(function(e) {
					e.preventDefault();

					if (!$(this).parent('li').hasClass('active')) {
						$(this)
							.closest('.nav-tabs')
							.find('.active')
							.removeClass('active');

						$(this)
							.parent('li')
							.addClass('active');

						var tabID = $(this).attr('href');
						$(tabID)
							.closest('.tab-content')
							.find('.active')
							.removeClass('active');

						$(tabID)
							.addClass('active');
					}
				});

			$('.nav-tabs > li > a')[0].click();
		}
	}

	/* ************** *
	 * Functions HTML *
	 * ************** */

	function addOption() {
		var inputHTML = '';
		inputHTML += '<div class="input-field input-option">';
			inputHTML += '<input class="option-keywords" type="text">';
		inputHTML += '</div>';
		
		$('.input-options').append(inputHTML);
	}

	/**
	 * Returns a tab menu item with link to the associated tab.
	 *
	 * @param String name
	 * @param String link
	 * @returns HTML
	 */
	function buildTabMenuItem(name, link) {
		return '<li><a href="#' + link + '" data-toggle="tab">' + name + '</a></li>';
	}

	/**
	 * Returns a tab menu item with link to the associated tab.
	 *
	 * @param String name
	 * @param String link
	 * @returns HTML
	 */
	function buildUserLink(userName) {
		return '<a href="https://steemit.com/@' + userName + '/" target="_blank">' + userName + '</a>';
	}

	/**
	 * Transforms to HTML.
	 *
	 * @param String content
	 * @returns HTML
	 */
	function formatContent(content) {
		function nl2br (str, is_xhtml) {   
			var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
		}

		var output = nl2br(content);
		return output;
	}

	/**
	 * Returns a comment formatted in HTML.
	 *
	 * @param Object comment
	 * @returns HTML
	 */
	function commentToHTML(comment) {
		var output = '';

		output += '<div class="comment-container">';
			output += '<div class="comment-info">';
				output += '<div class="user">';
					output += '<div class="user-pic"></div>';
					output += '<div class="user-name">';
					output += buildUserLink(comment['author']);
					output += '</div>';
				output += '</div>';
			output += '</div>';
			output += '<div class="comment-body">';
			output += formatContent(comment['body']);
			output += '</div>';
		output += '</div>';

		return output;
	}

	/**
	 * Returns a tab containing a list of comments.
	 *
	 * @param String id
	 * @param Array comments
	 * @returns HTML
	 */
	function buildTabItem(id, comments, voter) {
		var users = [];
		var output = '<div id="' + id + '" class="tab-pane">';

		var commentsHTML = '';
		$(comments)
			.each(function() {
				var comment = this.comment;
				commentsHTML += commentToHTML(comment);

				var userLink = buildUserLink(comment.author);

				var userAttr = [];
				if( voter.indexOf(comment.author) > -1 ) {
					userAttr.push('<span title="upvoted">u</span>');
				}

				if( followers.indexOf(comment.author) > -1 ) {
					userAttr.push('<span title="following">f</span>');
				}

				if(userAttr.length > 0) {
					userLink += '(' + userAttr.join() + ')';
				}

				users.push(userLink);
			});
			
		output += '<div class="option-summary"><span>';
		output += users.join(', ');
		output += '</span></div>';
		output += commentsHTML;
		output += '</div>';

		return output;
	}

	/**
	 * Outputs the Tabs to the site.
	 *
	 * @param Array items
	 */
	function buildTabs(items, voter) {

		var commentsByOption = items.byOption;
		var unresolved = items.unresolved;
		var unlocated = items.unlocated;

		var tabMenuHTML = '';
		var tabContentHTML = '';

		// add tab for each option
		if(commentsByOption.length > 0) {
			$(commentsByOption)
				.each(function(index, cComments) {

					if(typeof(cComments) !== 'undefined') {
						var tabName = index + 1;
						var tabID = 'tab_' + tabName;
						var users = getUsers(cComments);

						tabMenuHTML += buildTabMenuItem(tabName, tabID);
						tabContentHTML += buildTabItem(tabID, cComments, voter);
					}
				});
		}

		// add tab for all comments with multiple options
		if(unresolved.length > 0) {
			var tabName = 'unresolved';
			var tabID = 'tab_' + tabName;
			var users = getUsers(unresolved);

			tabMenuHTML += buildTabMenuItem(tabName, tabID);
			tabContentHTML += buildTabItem(tabID, unresolved, voter);
		}

		// add tab for all comments without hit
		if(unlocated.length > 0) {
			var tabName = 'unlocated';
			var tabID = 'tab_' + tabName;
			var users = getUsers(unlocated);

			tabMenuHTML += buildTabMenuItem(tabName, tabID);
			tabContentHTML += buildTabItem(tabID, unlocated, voter);
		}

		$('#content_options').html(tabMenuHTML);
		$('#content_comments').html(tabContentHTML);

		applyTabSwitch();
	}

	/* ************** *
	 * Functions -old *
	 * ************** */

	function evaluationToHTML(keys, users) {
		var output = '';

		var keywordstring = '';
		if(typeof(keys) != 'undefined' && keys.length > 0) {
			keywordstring = ' mentioning "' + keys + '"';
		}

		var usercountstring = '';
		if(typeof(users) != 'undefined' && users.length > 0) {
			usercountstring = users.length + ' user';

			if(users.length > 1) {
				usercountstring += 's';
			}
		}

		output += '<div class="evaluation">';
			output += '<span>Following ' + usercountstring + ' responded to your post' + keywordstring + ': ' + users.join(', ');
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
	 * Functions Main *
	 * ************** */

	function updateEval() {
		// get input values
		var upvotedOnly = $('#search_filter_upvoted').prop( "checked" );
		var followingOnly = $('#search_filte_following').prop( "checked" );
		var inputOptions = $('.input-options .input-option input.option-keywords');

		// build options array with associated keywords
		var options = buildOptionsArray(inputOptions);

		// build comments array providing additional information about each comment
		var displayComments = [];
		$(comments)
			.each(function() {
				var item = new Object();

				// add the comment
				item.comment = this;

				// add options found in the comment
				item.options = searchOptions(this['body'], options);

				// add the item to comments array
				displayComments.push(item);
			});

		
		var voter = getVoter();
		var filter = new Object();
		filter.upvotedOnly = upvotedOnly;
		filter.followingOnly = followingOnly;

		var commentsByOption = sortCommentsByOption(displayComments, voter, filter);

		buildTabs(commentsByOption, voter);
	}

	/* ************** *
	 * Document Ready *
	 * ************** */
	$(document)
		.ready(function(){

			function toggleSidebar(value) {
				var elements = $('.sidebar-item:not(#post_selection)');
	
				if( value == 'hide' ) {
					elements.hide();
				} else if( value == 'show' ) {
					elements.show({effect: 'fade', duration: 600});
				}
			}
			toggleSidebar('hide');

			// load comments on the post
			$('.button-load')
				.click(function(e){
					e.preventDefault();

					// get input values
					var author = $('#search_author').val();
					var permlink = $('#search_permlink').val();

					toggleSidebar('hide');

					var donePost = false;
					var doneReplies = false;
					var doneVotes = false;
					var doneFollowers = false;
					
					function checkDone() {
						if(donePost && doneReplies && doneVotes) {
							toggleSidebar('show');
							updateEval();
						}
					};

					/**
					 * Loads a new set of followers and adds them if contained in the given list of usernames.
					 *
					 * @param Array user
					 * @returns Array
					 */
					function addFollower(userNames, following, startFollower = '') {
						var followType = 'blog';
						var limit = 1000;

						steem.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
							console.log(err, result);

							$(result)
								.each(function() {
									// current follower has to be in the given list of names and not in follower list to prevent double entries
									if(userNames.indexOf(this.follower) > -1 && followers.indexOf(this.follower) == -1) {
										followers.push(this.follower);
									}
								});

							if(!(result.length < limit)) {
								var lasFollower = result[result.length-1];
								addFollower(userNames, following, lasFollower.follower);
							} else {
								doneFollowers = true;
								checkDone();
							}
						});
					}

					steem.api.getContent(author, permlink, function(err, result) {
						post = result;
						//console.log(err, result);

						donePost = true;
						checkDone();
					});

					// get all comments on a post from the api
					steem.api.getContentReplies(author, permlink, function(err, result) {
						comments = result;
						//console.log(err, result);

						doneReplies = true;
						checkDone();

						var commentAuthors = getUsers(comments, false);
						addFollower(commentAuthors, author)
					});

					steem.api.getActiveVotes(author, permlink, function(err, result) {
						votes = result;
						//console.log(err, result);

						doneVotes = true;
						checkDone();
					});
				});

			// search the comments of a post by search key on button click
			$('.button-search')
				.click(function(e){
					e.preventDefault();
					updateEval();
				})
				.click();

			// add another option input field
			$('.button-option-add')
				.click(function(e) {
					e.preventDefault();
					addOption();
				})
				.click();

		}); // end - $(document).ready();
})(jQuery);