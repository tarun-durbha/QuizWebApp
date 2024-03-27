import React, { Component, Fragment } from 'react';
import { Helmet } from 'react-helmet';
import M from 'materialize-css';
import classnames from 'classnames';

import questions from '../../questions.json';
import isEmpty from '../../utils/is-empty';

import correctNotification from '../../assets/audio/correct-answer.mp3';
import wrongNotification from '../../assets/audio/wrong-answer.mp3';
import buttonSound from '../../assets/audio/button-sound.mp3';

class Play extends Component {
    constructor(props) {
        super(props);
        this.state = {
            questions,
            currentQuestion: {},
            nextQuestion: {},
            previousQuestion: {},
            answer: '',
            numberOfQuestions: 0,
            numberOfAnsweredQuestions: 0,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            hints: 5,
            fiftyFifty: 2,
            usedFiftyFifty: false,
            nextButtonDisabled: false,
            previousButtonDisabled: true,
            previousRandomNumbers: [],
            time: {},
            numberOfAnsweredQuestions: 0,
            questionIndicators: []
        };
        this.interval = null;
        this.correctSound = React.createRef();
        this.wrongSound = React.createRef();
        this.buttonSound = React.createRef();
    }

    componentDidMount() {
        const { questions, currentQuestion, nextQuestion, previousQuestion } = this.state;
        this.displayQuestions(questions, currentQuestion, nextQuestion, previousQuestion);
        this.startTimer();

        const updatedQuestions = [...questions];
        updatedQuestions[0].visited = true;
        this.setState({ questions: updatedQuestions });
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    displayQuestions = (questions = this.state.questions, currentQuestion, nextQuestion, previousQuestion) => {
        let { currentQuestionIndex } = this.state;
        if (!isEmpty(this.state.questions)) {
            questions = this.state.questions;
            currentQuestion = questions[currentQuestionIndex];
            nextQuestion = questions[currentQuestionIndex + 1];
            previousQuestion = questions[currentQuestionIndex - 1];
            const answer = currentQuestion.answer;
            this.setState({
                currentQuestion,
                nextQuestion,
                previousQuestion,
                numberOfQuestions: questions.length,
                answer,
                previousRandomNumbers: [],
                // Initialize question indicators with no color
                questionIndicators: Array(questions.length).fill('')
            }, () => {
                this.showOptions();
                this.handleDisableButton();
            });
        }
    };

    handleOptionClick = (e) => {
        const { currentQuestionIndex, questions } = this.state;
        const index = currentQuestionIndex;
        const updatedQuestions = [...questions];
        const clickedOption = e.target;
        const correctAnswer = this.state.questions[currentQuestionIndex].answer.toLowerCase();
        updatedQuestions[currentQuestionIndex].visited = true;
        if (clickedOption.dataset.answer.toLowerCase() === correctAnswer) {
            updatedQuestions[currentQuestionIndex].answered = true;
            clickedOption.classList.add('correct-option');
            this.correctTimeout = setTimeout(() => {
                this.correctSound.current.play();
            }, 500);
            this.correctAnswer();
        } else {
            clickedOption.classList.add('wrong-option');
            const optionsContainer = clickedOption.parentElement;
            const options = optionsContainer.querySelectorAll('.option');

            options.forEach(option => {
                if (option.dataset.answer.toLowerCase() === correctAnswer) {
                    option.classList.add('correct-option');
                }
            });
            updatedQuestions[currentQuestionIndex].answered = true;

            this.wrongTimeout = setTimeout(() => {
                this.wrongSound.current.play();
            }, 500);
            this.wrongAnswer();
        }
        this.setState({ questions: updatedQuestions });
    }




    handleNextButtonClick = () => {
        const optionsContainers = document.querySelectorAll('.options-container');
        optionsContainers.forEach(container => {
            const options = container.querySelectorAll('.option');
            options.forEach(option => {
                option.classList.remove('correct-option', 'wrong-option');
            });
        });
        this.playButtonSound();
        if (this.state.nextQuestion !== undefined) {
            this.setState(prevState => ({
                currentQuestionIndex: prevState.currentQuestionIndex + 1
            }), () => {
                const { questions } = this.state;
                const updatedQuestions = [...questions];
                updatedQuestions[this.state.currentQuestionIndex].visited = true;
                this.setState({ questions: updatedQuestions });
                this.displayQuestions(this.state.state, this.state.currentQuestion, this.state.nextQuestion, this.state.previousQuestion);
            });
        }
    };

    // Function to handle "Previous" button click
    handlePreviousButtonClick = () => {
        const optionsContainers = document.querySelectorAll('.options-container');
        optionsContainers.forEach(container => {
            const options = container.querySelectorAll('.option');
            options.forEach(option => {
                option.classList.remove('correct-option', 'wrong-option');
            });
        });
        this.playButtonSound();
        if (this.state.previousQuestion !== undefined) {
            this.setState(prevState => ({
                currentQuestionIndex: prevState.currentQuestionIndex - 1
            }), () => {

                const { questions } = this.state;
                const updatedQuestions = [...questions];
                updatedQuestions[this.state.currentQuestionIndex].visited = true;
                this.setState({ questions: updatedQuestions });

                this.displayQuestions(this.state.state, this.state.currentQuestion, this.state.nextQuestion, this.state.previousQuestion);
            });
        }
    };

    // Function to handle "Quit" button click
    handleQuitButtonClick = () => {
        const optionsContainers = document.querySelectorAll('.options-container');
        optionsContainers.forEach(container => {
            const options = container.querySelectorAll('.option');
            options.forEach(option => {
                option.classList.remove('correct-option', 'wrong-option');
            });
        });
        this.playButtonSound();
        if (window.confirm('Are you sure you want to quit?')) {
            this.props.history.push('/');
        }
    };

    // Function to handle button click
    handleButtonClick = (e) => {
        switch (e.target.id) {
            case 'next-button':
                this.handleNextButtonClick();
                break;

            case 'previous-button':
                this.handlePreviousButtonClick();
                break;

            case 'quit-button':
                this.handleQuitButtonClick();
                break;

            default:
                break;
        }

    };

    // Function to play button sound
    playButtonSound = () => {
        this.buttonSound.current.play();
    };

    // Function to handle correct answer
    correctAnswer = () => {
        M.toast({
            html: 'Correct Answer!',
            classes: 'toast-valid',
            displayLength: 1500
        });
        setTimeout(() => {
            this.setState(prevState => ({
                score: prevState.score + 1,
                correctAnswers: prevState.correctAnswers + 1,
                currentQuestionIndex: prevState.currentQuestionIndex + 1,
                numberOfAnsweredQuestions: prevState.numberOfAnsweredQuestions + 1
            }), () => {
                if (this.state.nextQuestion === undefined) {
                    this.endGame();
                } else {
                    const optionsContainers = document.querySelectorAll('.options-container');
                    optionsContainers.forEach(container => {
                        const options = container.querySelectorAll('.option');
                        options.forEach(option => {
                            option.classList.remove('correct-option', 'wrong-option');
                        });
                    });
                    this.displayQuestions(this.state.questions, this.state.currentQuestion, this.state.nextQuestion, this.state.previousQuestion);
                }
            });
        }, 5000);
    }

    // Function to handle wrong answer
    wrongAnswer = () => {
        navigator.vibrate(1000);
        M.toast({
            html: 'Wrong Answer!',
            classes: 'toast-invalid',
            displayLength: 1500
        });
        setTimeout(() => {
            this.setState(prevState => ({
                wrongAnswers: prevState.wrongAnswers + 1,
                currentQuestionIndex: prevState.currentQuestionIndex + 1,
                numberOfAnsweredQuestions: prevState.numberOfAnsweredQuestions + 1
            }), () => {
                if (this.state.nextQuestion === undefined) {
                    this.endGame();
                } else {
                    const optionsContainers = document.querySelectorAll('.options-container');
                    optionsContainers.forEach(container => {
                        const options = container.querySelectorAll('.option');
                        options.forEach(option => {
                            option.classList.remove('correct-option', 'wrong-option');
                        });
                    });
                    this.displayQuestions(this.state.questions, this.state.currentQuestion, this.state.nextQuestion, this.state.previousQuestion);
                }
            });
        }, 5000);
    }

    // Remaining code remains unchanged...
    showOptions = () => {
        const options = Array.from(document.querySelectorAll('.option'));

        options.forEach(option => {
            option.style.visibility = 'visible';
        });

        this.setState({
            usedFiftyFifty: false
        });
    }

    handleHints = () => {
        if (this.state.hints > 0) {
            const options = Array.from(document.querySelectorAll('.option'));
            let indexOfAnswer;

            options.forEach((option, index) => {
                if (option.innerHTML.toLowerCase() === this.state.answer.toLowerCase()) {
                    indexOfAnswer = index;
                }
            });

            while (true) {
                const randomNumber = Math.round(Math.random() * 3);
                if (randomNumber !== indexOfAnswer && !this.state.previousRandomNumbers.includes(randomNumber)) {
                    options.forEach((option, index) => {
                        if (index === randomNumber) {
                            option.style.visibility = 'hidden';
                            this.setState((prevState) => ({
                                hints: prevState.hints - 1,
                                previousRandomNumbers: prevState.previousRandomNumbers.concat(randomNumber)
                            }));
                        }
                    });
                    break;
                }
                if (this.state.previousRandomNumbers.length >= 3) break;
            }
        }
    }

    handleFiftyFifty = () => {
        if (this.state.fiftyFifty > 0 && this.state.usedFiftyFifty === false) {
            const options = document.querySelectorAll('.option');
            const randomNumbers = [];
            let indexOfAnswer;

            options.forEach((option, index) => {
                if (option.innerHTML.toLowerCase() === this.state.answer.toLowerCase()) {
                    indexOfAnswer = index;
                }
            });

            let count = 0;
            do {
                const randomNumber = Math.round(Math.random() * 3);
                if (randomNumber !== indexOfAnswer) {
                    if (randomNumbers.length < 2 && !randomNumbers.includes(randomNumber) && !randomNumbers.includes(indexOfAnswer)) {
                        randomNumbers.push(randomNumber);
                        count++;
                    } else {
                        while (true) {
                            const newRandomNumber = Math.round(Math.random() * 3);
                            if (!randomNumbers.includes(newRandomNumber) && newRandomNumber !== indexOfAnswer) {
                                randomNumbers.push(newRandomNumber);
                                count++;
                                break;
                            }
                        }
                    }
                }
            } while (count < 2);

            options.forEach((option, index) => {
                if (randomNumbers.includes(index)) {
                    option.style.visibility = 'hidden';
                }
            });
            this.setState(prevState => ({
                fiftyFifty: prevState.fiftyFifty - 1,
                usedFiftyFifty: true
            }));
        }
    }

    startTimer = () => {
        const countDownTime = Date.now() + 180000;
        this.interval = setInterval(() => {
            const now = new Date();
            const distance = countDownTime - now;

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(this.interval);
                this.setState({
                    time: {
                        minutes: 0,
                        seconds: 0
                    }
                }, () => {
                    this.endGame();
                });
            } else {
                this.setState({
                    time: {
                        minutes,
                        seconds,
                        distance
                    }
                });
            }
        }, 1000);
    }

    handleDisableButton = () => {
        if (this.state.previousQuestion === undefined || this.state.currentQuestionIndex === 0) {
            this.setState({
                previousButtonDisabled: true
            });
        } else {
            this.setState({
                previousButtonDisabled: false
            });
        }

        if (this.state.nextQuestion === undefined || this.state.currentQuestionIndex + 1 === this.state.numberOfQuestions) {
            this.setState({
                nextButtonDisabled: true
            });
        } else {
            this.setState({
                nextButtonDisabled: false
            });
        }
    }

    endGame = () => {
        alert('Quiz has eneded!');
        const { state } = this;
        const playerStats = {
            score: state.score,
            numberOfQuestions: state.numberOfQuestions,
            numberOfAnsweredQuestions: state.correctAnswers + state.wrongAnswers,
            correctAnswers: state.correctAnswers,
            wrongAnswers: state.wrongAnswers,
            fiftyFiftyUsed: 2 - state.fiftyFifty,
            hintsUsed: 5 - state.hints
        };
        setTimeout(() => {
            this.props.history.push('/play/quizSummary', playerStats);
        }, 1000);
    }
    jumpToQuestion(questionIndex) {
        // Check if the questionIndex is within bounds
        if (questionIndex >= 0 && questionIndex < this.state.questions.length) {
            // Update the currentQuestionIndex in the state
            this.setState(prevState => ({
                currentQuestionIndex: questionIndex,
                currentQuestion: prevState.questions[questionIndex]  // Update currentQuestion based on selected index
            }));

            // Mark the selected question as visited
            const { questions } = this.state;
            const updatedQuestions = [...questions];
            updatedQuestions[questionIndex].visited = true;
            this.setState({ questions: updatedQuestions });
        }
    }




    render() {
        const {
            currentQuestion,
            currentQuestionIndex,
            fiftyFifty,
            hints,
            numberOfQuestions,
            time
        } = this.state;

        const questionNumbers = [];
        for (let i = 0; i < numberOfQuestions; i++) {
            questionNumbers.push(
                <button
                    key={i}
                    className={classnames('question-number', {
                        'answered': this.state.questions[i].answered && i !== currentQuestionIndex,
                        'current': i === currentQuestionIndex,
                        'unanswered': !this.state.questions[i].answered && this.state.questions[i].visited && i !== currentQuestionIndex,
                    })}
                    onClick={() => this.jumpToQuestion(i)}
                >
                    {i + 1}
                </button>
            );
        }

        return (
            <Fragment>
                <Helmet><title>Quiz Page</title></Helmet>

                <Fragment>
                    <audio ref={this.correctSound} src={correctNotification}></audio>
                    <audio ref={this.wrongSound} src={wrongNotification}></audio>
                    <audio ref={this.buttonSound} src={buttonSound}></audio>
                </Fragment>
                <div className="questions">
                    <h2>Quiz Mode</h2>
                    <div className="progress-container">
                        <div className="question-numbers">
                            {questionNumbers}
                        </div>
                    </div>
                    <div className="lifeline-container">
                        <p>
                            <span onClick={this.handleFiftyFifty} className="mdi mdi-set-center mdi-24px lifeline-icon">
                                <span className="lifeline">{fiftyFifty}</span>
                            </span>
                        </p>
                        <p>
                            <span onClick={this.handleHints} className="mdi mdi-lightbulb-on-outline mdi-24px lifeline-icon">
                                <span className="lifeline">{hints}</span>
                            </span>
                        </p>
                    </div>
                    <div className="timer-container">
                        <p>
                            <span className="left" style={{ float: 'left' }}>{currentQuestionIndex + 1} of {numberOfQuestions}</span>
                            <span className={classnames('right valid', {
                                'warning': time.distance <= 120000,
                                'invalid': time.distance < 30000
                            })}>
                                {time.minutes}:{time.seconds}
                                <span className="mdi mdi-clock-outline mdi-24px"></span></span>
                        </p>
                    </div>
                    <h5>{currentQuestion.question}</h5>
                    <div className="options-container">
                        <p onClick={this.handleOptionClick} className="option" data-answer={currentQuestion?.optionA?.toLowerCase()}>{currentQuestion.optionA}</p>
                        <p onClick={this.handleOptionClick} className="option" data-answer={currentQuestion?.optionB?.toLowerCase()}>{currentQuestion.optionB}</p>


                        <p onClick={this.handleOptionClick} className="option" data-answer={currentQuestion?.optionC?.toLowerCase()}>{currentQuestion.optionC}</p>
                        <p onClick={this.handleOptionClick} className="option" data-answer={currentQuestion?.optionD?.toLowerCase()}>{currentQuestion.optionD}</p>
                    </div>


                    <div className="button-container">
                        <button
                            className={classnames('', { 'disable': this.state.previousButtonDisabled })}
                            id="previous-button"
                            onClick={this.handleButtonClick}>
                            Previous
                        </button>
                        <button
                            className={classnames('', { 'disable': this.state.nextButtonDisabled })}
                            id="next-button"
                            onClick={this.handleButtonClick}>
                            Next
                        </button>
                        <button id="quit-button" onClick={this.handleButtonClick}>Quit</button>
                    </div>
                </div>
            </Fragment>
        );
    }

}

export default Play;