var Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body,validationResult } = require("express-validator");
// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find({})
    .sort([['name','ascending']])
    .exec(function(err, data){
        console.log(data);
        res.render('genre_list', {title:'Genre List', data: data});
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    const {id} = req.params;
    console.log(req.params);
    async.parallel({
        genre_name: function(callback){
            Genre.find({_id:id})
            .exec(function(err,data){
                callback(err,data);
            })
        },
        book_list: function(callback) {
            Book.find({genre: id})
            .exec(function(err,data){
                callback(err,data);
            })
        }
    }, function(err, result) {
        res.render('genre_page', {title: result.genre_name.name, data: result.book_list});
    })

    
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre', errors:''});
};

// Handle Genre create on POST.

    // Handle Genre create on POST.
exports.genre_create_post =  [

    // Validate and santize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];
  
    


// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};
