// POSTS NO DATABASE
var database = firebase.database();
var USER_ID = window.location.search.match(/\?id=(.*)/)[1];
localStorage.setItem('userID', USER_ID);

var FOLLOWED_FRIENDS = [];
database.ref("friendship/" + USER_ID).once('value')
.then(function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    FOLLOWED_FRIENDS.push(childSnapshot.val().friend);
  });
});

$(document).ready(function() {
  getAllPostsFromDB();
  $('input[name=filter]').click(getAllPostsFromDB);
  $("#publish").click(addPostsClick);

  function addPostsClick(event) {
    event.preventDefault();

    var newPost = $("#textPub").val();
    var visualization = $("#visualization option:selected").val();
    var postFromDB = addPostToDB(newPost, visualization);
  }

  function addPostToDB(text, visualization) {
    return database.ref("posts/" + USER_ID).push({
      text: text,
      type: visualization
    });
  }

  function getAllPostsFromDB() {
    database.ref("posts").once('value')
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        getPostsList(childSnapshot);
      });
    });
  }

  function getPostsList(userIdPostsFromDB) {
    $("#msg").html('');
    var filterSelected = $('input[name=filter]:checked').val();
    var idOwnerPosts = userIdPostsFromDB.key;

    database.ref("posts/" + idOwnerPosts).once('value')
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        if(filterSelected === 'all' && childSnapshot.val().type !== 'private' && (idOwnerPosts === USER_ID || FOLLOWED_FRIENDS.indexOf(idOwnerPosts) >= 0)) {
          getOwnersPosts(idOwnerPosts, childSnapshot);
        }
        if (filterSelected === 'friends' && childSnapshot.val().type !== 'private' && FOLLOWED_FRIENDS.indexOf(idOwnerPosts) >= 0) {
          getOwnersPosts(idOwnerPosts, childSnapshot);
        }
        if (filterSelected === 'private' && childSnapshot.val().type === 'private' && idOwnerPosts === USER_ID) {
          getOwnersPosts(idOwnerPosts, childSnapshot);
        }
      });

      function getOwnersPosts(idOwnerPosts, childSnapshot) {
        database.ref("users/" + idOwnerPosts).once('value')
        .then(function(snapshot) {
          var nameOwnerPosts = snapshot.val().name;
          var idOfPost = childSnapshot.key;
          var post = childSnapshot.val().text;
          if (idOwnerPosts === USER_ID) {
            printOwnerPosts(nameOwnerPosts, idOfPost, post);
          } else {
            printAllPosts(nameOwnerPosts, post);
          }
        });
      }

      function printOwnerPosts(nameOwnerPosts, idOfPost, post) {
        $("#msg").append(`
          <div class="mb-4">
            <img src="../images/edit.jpg" width="18" id="edit-${idOfPost}" class="mr-2">
            <img src="../images/delete.png" width="18" id="delete-${idOfPost}">
            <h6 class="mb-2">${nameOwnerPosts}</h6>
            <p>${post}</p>
          </div>
        `);
        $(`#edit-${idOfPost}`).click(function() {
          $(this).nextAll('p:first').attr('contentEditable', 'true').focus().blur(function() {
            var newText = $(this).html();
            database.ref("posts/" + USER_ID + "/" + idOfPost + "/text").set(newText);
            $(this).attr('contentEditable', 'false');
          })
        });
        $(`#delete-${idOfPost}`).click(function() {
          database.ref("posts/" + USER_ID + "/" + idOfPost).remove();
          $(this).parent().remove();
        });
        $('#publish').attr('disabled', 'true');
      }

      function printAllPosts(nameOwnerPosts, post) {
        $("#msg").append(`
        <div class="mb-4">
          <h6 class="mb-2">${nameOwnerPosts}</h6>
          <p>${post}</p>
        </div>
        `);
      }
    });
  }

  // FUNCIONALIDADES DOS POSTS
  var text = document.getElementById('textPub');
  $('#publish').attr('disabled', 'true');
  $('#publish').css('backgroundColor', '#a9a9a9');

  $('#publish').click(function onClickPost(event) {
    event.preventDefault(event);
    var value = $('#textPub').val();
    text.value = '';
    $('#publish').css('backgroundColor', '#a9a9a9');
    location.reload();
  });

  $('#textPub').keyup(function stylesCounterBtn() {
    if ($('#textPub').val.length > 0) {
      $('#publish').removeAttr('disabled');
      $('#publish').css('backgroundColor', '#369736');
    }
    text.style.height = '';
    text.style.height = text.scrollHeight + 'px';
  });

  function autoResize() {
    while (text.scrollHeight > text.offsetHeight) {
      text.rows += 1;
    }
  }


// POSTAR FOTOS

//STORAGE
  $('#postPhoto').click(function(e) {
    var fileUpload = document.getElementById('photo').files[0];
    var storageRef = firebase.storage().ref('photos/' + USER_ID + '/' + fileUpload.name);
    storageRef.put(fileUpload);

// TELA
    var preview = document.querySelector('#photo-storage');
    var file = document.querySelector('input[type=file]').files[0];
    localStorage.setItem('file', file);
    var reader = new FileReader();
    reader.onloadend = function () {
      preview.src = reader.result;
    }
    if (file) {
      reader.readAsDataURL(file);
    } else {
      preview.src = "";
    }

  //DATABASE

  $('#photo').on('change', function(event) {
    var images = firebase.storage().ref().child('photos/' + USER_ID);
    var image = images.child('image1');
    image.getDownloadURL().then((url) => { this.setState({ img: url }));
    };
  });

  // $('#photo').on('change', function(event) {
  //   selectedFile = event.target.files[0];
  //   var filename = selectedFile.name;
  //   var storageRef = firebase.storage().ref('/photos/' + filename);
  //   var uploadTask = storageRef.put(selectedFile);
  //   uploadTask.on('state_changed', function(snapshot) {
  //   }, function(error) {
  //      alert('Erro:' + error);
  //   }, function() {
  //     var postKey = firebase.database().ref('posts/').push().key;
  //     var downloadURL = uploadTask.snapshot.downloadURL;
  //     var visualization = $("#visualization option:selected").val();
  //     var updates = {};
  //     var postData = {
  //       url: downloadURL,
  //       type: visualization
  //     };
  //     updates['/posts/' + postKey] = postData;
  //     firebase.database().ref.update(updates);
  //   });
  //   });


});




// SEARCH
  $('#btn-search').click(function() {
    var searchValueFromNewsFeed = $('#input-search').val();
    localStorage.setItem('inputValue', searchValueFromNewsFeed);
    window.location = "search.html?id=" + USER_ID;
  });

  $('#profile-view').click(function() {
    window.location = "profile.html?id=" + USER_ID;
  });

});
