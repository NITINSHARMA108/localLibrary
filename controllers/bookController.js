const Author = require('../models/author');
const BookInstance = require('../models/bookinstance');
const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body,validationResult } = require("express-validator");

// returning index page
exports.index = async function(req, res, next) {
		async.parallel({
		book_count: function(callback){
			Book.find({},(err,data)=>{
			
				callback(null,data.length);
			});
		},
		book_instance_count: function(callback){
			BookInstance.find({},(err,data)=>{
			
				callback(null,data.length);
			})
		},
		author_count: function(callback){
			Author.find({},(err,data)=>{
				console.log(data);
				callback(null,data.length)
			})
		},
		genre_count: function(callback){
			Genre.find({},(err,data)=>{
			
				callback(null,data.length);
			})
		}

	}, function(err, data) {
	
		res.render('index',{ title: 'Local Library Home', error: err, data: data})
	}) 

};

// Display list of all books.
exports.book_list = async function(req, res, next) {
	const response = await Book.find({})
	.sort({title: 1})
	.populate('author')
	
	res.render('book_list', {data: response});
};

// Display detail page for a specific book.
exports.book_detail = function(req, res) {
	const {id} = req.params;
	console.log(id);
	async.parallel({
		get_book: function(callback){
			Book.findById(id)
			.populate('author')
			.populate('genre')
			.exec((err,data)=>{
				
				callback(err,data);
			})
			
		},
		get_book_copies: function(callback){
			BookInstance.find({book: id})
			.exec(function(err,data){
				callback(err,data);
			})
		}
	}, function(err, data){
		console.log(data);
		res.render('single_book', {book: data.get_book, data: data.get_book_copies});
	})
};

// Display book create form on GET.
exports.book_create_get = function(req, res) {
	async.parallel({
		get_authors: function(callback){
			Author.find({})
			.exec(function(err,data){
				callback(err,data);
			})
		},
		get_genre:function(callback){
			Genre.find({})
			.exec(function(err,data){
				callback(err,data);
			})
		}
	},function(err, results){
		console.log(results);
		res.render('book_form', {title:'Book Create Form', genre: results.get_genre, authors: results.get_authors, errors: ''})
	})
};

// Handle book create on POST.
// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];


// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
	res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
	res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        });

};


// Handle book update on POST.
// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];

